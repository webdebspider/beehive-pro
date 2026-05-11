/**
 * app/hive/voice-log.tsx
 * ════════════════════════════════════════════════════════════════════════════
 * Voice Log Screen — hands-free hive inspection logging.
 *
 * Speak naturally, detected fields shown as badges, tap Save to write
 * directly to Firestore. No routing params needed — eliminates the
 * timing issue of trying to pre-fill another screen.
 *
 * Flow: Speak → detect keywords → review badges → Save Inspection
 *
 * ─── 2026-05-11 EXPO GO COMPATIBILITY UPDATE ──────────────────────────────
 * `expo-speech-recognition` requires a NATIVE MODULE that is only available
 * in a development build (or production build), NOT in Expo Go. Expo Go is
 * a generic shell app that only includes a fixed list of pre-bundled native
 * modules; custom ones like ExpoSpeechRecognition are not in that list.
 *
 * Behavior by environment:
 *   • Android dev builds (Firebase App Distribution APKs) → FULL voice log
 *   • iOS dev-client builds (future, requires Apple Dev account)  → FULL voice log
 *   • iOS Expo Go (current iOS dev workflow)                       → FALLBACK UI
 *   • Android Expo Go (rare for this project)                      → FALLBACK UI
 *
 * The change in this file:
 *   1. Detect Expo Go via Constants.appOwnership === "expo"
 *   2. Lazy-require expo-speech-recognition (instead of top-level import)
 *      so the file doesn't crash on module load in Expo Go
 *   3. Provide no-op fallbacks for the hook + module API
 *   4. Render an <ExpoGoFallback /> component when speech isn't available
 *
 * Nothing else changed. All existing dev-build behavior is preserved.
 * ════════════════════════════════════════════════════════════════════════════
 */

// ── Standard imports (safe in any environment) ──────────────────────────────
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// expo-constants is bundled with Expo Go itself, so this is always safe to
// import. We use it to detect whether we're running inside Expo Go.
import Constants from "expo-constants";

import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

// ════════════════════════════════════════════════════════════════════════════
// ── Expo Go detection + lazy speech-recognition loading ────────────────────
// ════════════════════════════════════════════════════════════════════════════

/**
 * Are we running inside the Expo Go shell app?
 *
 * Constants.appOwnership values:
 *   "expo"        → running inside Expo Go (custom native modules NOT available)
 *   "standalone"  → standalone build (deprecated in newer SDKs; still used in some)
 *   null          → development build / bare workflow (custom native modules available)
 *
 * We only support speech recognition when NOT in Expo Go.
 */
const isExpoGo = Constants.appOwnership === "expo";

/**
 * Module-level holders for the speech API. We declare them as nullable so we
 * can leave them null when speech isn't available, and check before calling
 * methods on them at runtime.
 *
 * IMPORTANT: we use `require()` (CommonJS) instead of `import` (ES Modules)
 * for expo-speech-recognition because `require()` is LAZY — it only loads
 * the module when the require() statement runs. ES `import` is eagerly
 * resolved at the top of the file, which would crash in Expo Go before any
 * of our conditional logic ever executed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ExpoSpeechRecognitionModule: any = null;
/**
 * Fallback no-op for useSpeechRecognitionEvent. In Expo Go we never want to
 * call into the real native hook, so we just provide a function that
 * accepts the same arguments and does nothing. This means calling the hook
 * inside our component is safe regardless of environment — the actual
 * speech-recognition call sites also have isExpoGo guards.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useSpeechRecognitionEvent: any = (_event: string, _cb: any) => {};

if (!isExpoGo) {
  // Only attempt to load the native module when NOT in Expo Go. Even here we
  // wrap in try/catch in case the user is running a dev build that somehow
  // omits the speech-recognition package — better to fall back gracefully
  // than crash.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speechMod = require("expo-speech-recognition");
    ExpoSpeechRecognitionModule = speechMod.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechMod.useSpeechRecognitionEvent;
  } catch (e) {
    // Log but don't crash. The component will see `ExpoSpeechRecognitionModule
    // === null` at render time and show the fallback UI.
    // eslint-disable-next-line no-console
    console.warn("[voice-log] expo-speech-recognition not available:", e);
  }
}

/**
 * Convenience flag for "voice features actually work right now."
 * True only when we're outside Expo Go AND the module loaded successfully.
 */
const speechAvailable = !isExpoGo && ExpoSpeechRecognitionModule !== null;

// ════════════════════════════════════════════════════════════════════════════
// ── Keyword Parser (pure functions — environment-agnostic) ─────────────────
// ════════════════════════════════════════════════════════════════════════════

type DetectedFindings = {
  queen: string[];
  brood: string;
  mites: string;
  hiveBeetles: string;
  temperament: string;
};

function parseTranscript(text: string): DetectedFindings {
  const t = text.toLowerCase();
  const findings: DetectedFindings = {
    queen: [],
    brood: "",
    mites: "",
    hiveBeetles: "",
    temperament: "",
  };

  // Queen — multi-flag (can have several markers set simultaneously)
  if (/queen seen|saw the queen|queen present|found the queen|spotted the queen/.test(t)) {
    if (!findings.queen.includes("seen")) findings.queen.push("seen");
  }
  if (/\beggs?\b/.test(t) && !/no eggs/.test(t)) {
    if (!findings.queen.includes("eggs")) findings.queen.push("eggs");
  }
  if (/no queen|queen not found|couldn.t find|can.t find queen|missing queen|didn.t see queen/.test(t)) {
    if (!findings.queen.includes("not_found")) findings.queen.push("not_found");
  }
  if (/queen cell|swarm cell|queen cup|supersedure/.test(t)) {
    if (!findings.queen.includes("cells")) findings.queen.push("cells");
  }

  // Brood — single-value (one of: strong/medium/weak/spotty)
  if (/strong brood|solid brood|good brood|great brood|healthy brood|full brood/.test(t)) findings.brood = "strong";
  else if (/medium brood|okay brood|ok brood|decent brood|average brood/.test(t)) findings.brood = "medium";
  else if (/weak brood|poor brood|thin brood|sparse brood|light brood/.test(t)) findings.brood = "weak";
  else if (/spotty brood|spotty pattern|patchy brood|swiss cheese|uneven brood/.test(t)) findings.brood = "spotty";

  // Mites — single-value count bucket
  if (/no mites|zero mites|mites zero|0 mites|no varroa/.test(t)) findings.mites = "0";
  else if (/one mite|two mites|1 mite|2 mites|one or two|1 or 2/.test(t)) findings.mites = "2";
  else if (/three|four|five|[345] mite/.test(t)) findings.mites = "5";
  else if (/six|seven|eight|nine|ten|[6-9]|10.*mite/.test(t)) findings.mites = "6-10";
  else if (/ten plus|10 plus|many mites|lots of mites|heavy mites|high mite/.test(t)) findings.mites = "10+";

  // Beetles — single-value severity bucket
  if (/no beetle|zero beetle|no hive beetle|without beetle/.test(t)) findings.hiveBeetles = "none";
  else if (/few beetle|some beetle|one or two beetle|couple.*beetle/.test(t)) findings.hiveBeetles = "few";
  else if (/moderate beetle|several beetle|some hive beetle/.test(t)) findings.hiveBeetles = "moderate";
  else if (/heavy beetle|many beetle|lots of beetle|infest/.test(t)) findings.hiveBeetles = "heavy";

  // Temperament — single-value mood
  if (/calm|gentle|docile|peaceful|relaxed/.test(t)) findings.temperament = "calm";
  else if (/defensive|aggressive|angry|stinging|hot bee|mean|attack/.test(t)) findings.temperament = "defensive";
  else if (/active|busy|flying around/.test(t)) findings.temperament = "active";

  return findings;
}

const QUEEN_LABELS: Record<string, string> = {
  seen: "👑 Queen seen",
  eggs: "🥚 Eggs found",
  not_found: "❌ Not found",
  cells: "🔮 Queen cells",
};

// ════════════════════════════════════════════════════════════════════════════
// ── ExpoGoFallback — friendly placeholder when speech isn't available ──────
// ════════════════════════════════════════════════════════════════════════════

/**
 * Rendered when running in Expo Go (or any environment where the speech
 * recognition native module didn't load). Looks consistent with the rest
 * of the app (same NavBar + SafeAreaView), explains the limitation, and
 * gives the user a way to navigate away without confusion.
 *
 * Beta testers running the Android APK from Firebase App Distribution will
 * NEVER see this — they get the full voice log. This is purely for the
 * developer-side iOS Expo Go workflow (and any edge cases).
 */
function ExpoGoFallback() {
  const router = useRouter();
  const theme = useAppTheme();
  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.fallbackContainer}>
        <Text style={S.fallbackEmoji}>🎙️</Text>
        <Text style={S.fallbackTitle}>Voice Log requires a dev build</Text>
        <Text style={S.fallbackBody}>
          Voice logging uses native speech-recognition that isn&apos;t available in
          Expo Go. It works fully on the Android development builds distributed
          via Firebase App Distribution.{"\n\n"}
          To test voice log on iOS, an iOS development build is needed (requires
          an Apple Developer account + EAS build).
        </Text>
        <Pressable
          onPress={() => router.replace("/hive")}
          style={S.fallbackButton}
          accessibilityRole="button"
          accessibilityLabel="Return to Hive home"
        >
          <Text style={S.fallbackButtonText}>← Back to Hive Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Main Screen ────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

export default function VoiceLogScreen() {
  // ─── ALL HOOKS DECLARED UNCONDITIONALLY (Rules of Hooks compliance) ─────
  // We must call every hook on every render path, even when we'll end up
  // returning the fallback. The hooks themselves do no harm in Expo Go
  // because useSpeechRecognitionEvent is replaced with a no-op above.
  const router = useRouter();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const isListeningRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  // Computed: full live transcript (final words + any in-progress interim)
  const fullTranscript = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
  const detected = parseTranscript(fullTranscript);
  const hasDetections =
    detected.queen.length > 0 ||
    !!detected.brood ||
    !!detected.mites ||
    !!detected.hiveBeetles ||
    !!detected.temperament;

  // ─── Permissions + cleanup ────────────────────────────────────────────
  // Guard inside the effect so the no-op path still satisfies the hook
  // dependency rules without crashing on a null module.
  useEffect(() => {
    if (!speechAvailable) {
      // No speech support — explicitly mark permission unknown.
      // The fallback UI will short-circuit before we try to use it.
      setHasPermission(false);
      return;
    }
    ExpoSpeechRecognitionModule.requestPermissionsAsync().then(
      (result: { granted: boolean }) => {
        setHasPermission(result.granted);
      },
    );
    return () => {
      // Clean up if user navigates away mid-listening
      if (isListeningRef.current && ExpoSpeechRecognitionModule) {
        ExpoSpeechRecognitionModule.abort();
      }
    };
  }, []);

  // ─── Speech event subscriptions ───────────────────────────────────────
  // In Expo Go, useSpeechRecognitionEvent is a no-op so these calls do
  // nothing. In dev builds, they wire up to the native module's event stream.
  useSpeechRecognitionEvent("result", (event: { results: { transcript: string }[]; isFinal: boolean }) => {
    const transcript = event.results[0]?.transcript || "";
    if (event.isFinal) {
      setFinalTranscript((prev) => (prev + " " + transcript).trim());
      setInterimTranscript("");
    } else {
      setInterimTranscript(transcript);
    }
    // Auto-scroll the transcript view to the bottom on new text
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  });

  useSpeechRecognitionEvent("end", () => {
    if (isListeningRef.current && speechAvailable) {
      // Continuous mode: restart listening when the native engine ends a
      // segment. This gives the user the illusion of a long uninterrupted
      // dictation session.
      ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: true });
    } else {
      setIsListening(false);
      setInterimTranscript("");
    }
  });

  useSpeechRecognitionEvent("error", (event: { error: string }) => {
    // Ignore expected events (silent stops, manual aborts)
    if (event.error !== "aborted" && event.error !== "no-speech") {
      setIsListening(false);
      isListeningRef.current = false;
    }
  });

  // ─── EXPO GO FALLBACK (after all hooks have been called) ──────────────
  // This is the early-return that prevents any speech-recognition calls
  // from running in Expo Go. All hooks above have already executed, so
  // React's rules of hooks are satisfied.
  if (!speechAvailable) {
    return <ExpoGoFallback />;
  }

  // ════════════════════════════════════════════════════════════════════════
  // ── Below this line: full voice-log behavior (dev-build only) ──────────
  // ════════════════════════════════════════════════════════════════════════

  const startListening = async () => {
    if (hasPermission === false) {
      Alert.alert("Microphone Permission", "Please grant microphone access in your device settings.");
      return;
    }
    isListeningRef.current = true;
    setIsListening(true);
    setInterimTranscript("");
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: true });
  };

  const stopListening = () => {
    isListeningRef.current = false;
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const clearTranscript = () => {
    stopListening();
    setFinalTranscript("");
    setInterimTranscript("");
  };

  const handleSave = async () => {
    if (!hiveId) {
      Alert.alert("Error", "No hive ID — go back and try again.");
      return;
    }
    if (!fullTranscript && !hasDetections) {
      Alert.alert("Nothing to save", "Speak something first.");
      return;
    }
    if (isListening) stopListening();
    setSaving(true);
    try {
      const queenValue = detected.queen.join(", ");
      const now = new Date();
      await addDoc(collection(db, "hives", hiveId, "inspections"), {
        hiveId,
        queen: queenValue,
        brood: detected.brood,
        mites: detected.mites,
        hiveBeetles: detected.hiveBeetles,
        temperament: detected.temperament,
        notes: `Voice inspection:\n${fullTranscript}`,
        voiceMode: true,
        quickMode: true,
        date: now.toISOString(),
        createdAt: serverTimestamp(),
      });
      Alert.alert("Inspection Saved! 🐝", "Voice inspection recorded.", [
        { text: "View Hive", onPress: () => router.replace({ pathname: "/hive/[id]", params: { id: hiveId } }) },
        { text: "Go Home", onPress: () => router.replace("/hive") },
      ]);
    } catch {
      Alert.alert("Save Failed", "Could not save inspection. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.container}>

        {/* Transcript view — both final + interim text */}
        <ScrollView ref={scrollRef} style={S.transcriptScroll} contentContainerStyle={S.transcriptContent}>
          <Text style={S.transcriptLabel}>TRANSCRIPT</Text>
          {fullTranscript ? (
            <>
              <Text style={S.transcriptText}>{finalTranscript}</Text>
              {interimTranscript ? <Text style={S.interimText}>{interimTranscript}</Text> : null}
            </>
          ) : (
            <Text style={S.placeholderText}>
              {isListening
                ? "Listening... speak naturally about your hive 🐝"
                : `Tap the mic and speak naturally.\n\nTry: "Queen seen, eggs present, strong brood, no mites, bees are calm"`}
            </Text>
          )}
        </ScrollView>

        {/* Detected findings badges — only shown when parser found something */}
        {hasDetections && (
          <View style={S.detectedSection}>
            <Text style={S.detectedLabel}>DETECTED</Text>
            <View style={S.detectedBadges}>
              {detected.queen.map((q) => (
                <View key={q} style={S.badge}>
                  <Text style={S.badgeText}>{QUEEN_LABELS[q] || q}</Text>
                </View>
              ))}
              {detected.brood ? <View style={S.badge}><Text style={S.badgeText}>🐛 {detected.brood} brood</Text></View> : null}
              {detected.mites ? <View style={S.badge}><Text style={S.badgeText}>🔬 {detected.mites} mites</Text></View> : null}
              {detected.hiveBeetles ? <View style={S.badge}><Text style={S.badgeText}>🪲 {detected.hiveBeetles} beetles</Text></View> : null}
              {detected.temperament ? <View style={S.badge}><Text style={S.badgeText}>😊 {detected.temperament}</Text></View> : null}
            </View>
          </View>
        )}

        {/* Mic button — large circular tappable target */}
        <View style={S.micSection}>
          <Pressable onPress={toggleListening} style={[S.micButton, isListening && S.micButtonActive]}>
            <Text style={S.micEmoji}>{isListening ? "⏹️" : "🎙️"}</Text>
          </Pressable>
          <Text style={S.micLabel}>{isListening ? "Tap to stop" : "Tap to speak"}</Text>
          {isListening && <Text style={S.listeningText}>● LIVE</Text>}
        </View>

        {/* Bottom action row: Clear + Save */}
        <View style={S.actions}>
          <Pressable onPress={clearTranscript} style={S.clearButton}>
            <Text style={S.clearText}>🗑️ Clear</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving || (!fullTranscript && !hasDetections)}
            style={[S.saveButton, (saving || (!fullTranscript && !hasDetections)) && S.disabledButton]}
          >
            <Text style={S.saveText}>{saving ? "Saving..." : "💾 Save Inspection"}</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Styles ─────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    // ── Shared page wrapper ──────────────────────────────────────────────
    page: { flex: 1, backgroundColor: theme.bg },

    // ── Main voice-log layout ────────────────────────────────────────────
    container: { flex: 1, paddingHorizontal: theme.spaceMD, paddingBottom: 16 },
    transcriptScroll: {
      flex: 1,
      backgroundColor: theme.bgCard,
      borderRadius: theme.radiusLG,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: theme.spaceSM,
    },
    transcriptContent: { padding: theme.spaceMD, minHeight: 120 },
    transcriptLabel: {
      color: theme.textMuted,
      fontSize: theme.fontXS,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    transcriptText: { color: theme.textPrimary, fontSize: theme.fontMD, lineHeight: 26 },
    interimText: { color: theme.textMuted, fontSize: theme.fontMD, lineHeight: 26, fontStyle: "italic" },
    placeholderText: { color: theme.textMuted, fontSize: theme.fontSM, lineHeight: 22 },

    detectedSection: { paddingVertical: theme.spaceSM },
    detectedLabel: {
      color: theme.textMuted,
      fontSize: theme.fontXS,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    detectedBadges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    badge: {
      backgroundColor: theme.bgCardAlt,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.honey,
    },
    badgeText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontXS },

    micSection: { alignItems: "center", paddingVertical: theme.spaceMD },
    micButton: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.bgCard,
      borderWidth: 3,
      borderColor: theme.honey,
      justifyContent: "center",
      alignItems: "center",
      elevation: 6,
      shadowColor: theme.honey,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
    },
    micButtonActive: { backgroundColor: theme.honey, borderColor: theme.honeyLight },
    micEmoji: { fontSize: 40 },
    micLabel: { color: theme.textMuted, fontSize: theme.fontSM, fontWeight: "700", marginTop: 10 },
    listeningText: { color: theme.danger, fontWeight: "900", fontSize: theme.fontXS, marginTop: 6 },

    actions: { flexDirection: "row", gap: 10 },
    clearButton: {
      backgroundColor: theme.bgCardAlt,
      padding: 14,
      borderRadius: theme.radiusMD,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      flex: 1,
    },
    clearText: { color: theme.textSecondary, fontWeight: "800", fontSize: theme.fontSM },
    saveButton: { backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", flex: 2 },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },

    // ── Expo Go fallback ─────────────────────────────────────────────────
    fallbackContainer: {
      flex: 1,
      padding: theme.spaceLG,
      justifyContent: "center",
      alignItems: "center",
    },
    fallbackEmoji: { fontSize: 64, marginBottom: theme.spaceMD },
    fallbackTitle: {
      color: theme.textPrimary,
      fontSize: theme.fontLG,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: theme.spaceSM,
    },
    fallbackBody: {
      color: theme.textSecondary,
      fontSize: theme.fontSM,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: theme.spaceLG,
    },
    fallbackButton: {
      backgroundColor: theme.honey,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: theme.radiusMD,
    },
    fallbackButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
  });
}
