/**
 * app/hive/voice-log.tsx
 *
 * Voice Log Screen — hands-free hive inspection logging.
 * Speak naturally and the app detects queen/brood/mites/beetle/temperament keywords.
 *
 * Usage:
 *  - From quick inspection: navigates back with detected values as params
 *  - From add inspection: navigates back with full transcript as notes param
 *
 * Receives params:
 *  - id: hiveId
 *  - source: "quick" | "add"
 *
 * Requires expo-speech-recognition (installed via: npx expo install expo-speech-recognition)
 * Note: Requires development build or Expo Go with microphone permission granted.
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";

// ── Keyword Parser ─────────────────────────────────────────────────────────────

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

  // Queen
  if (/queen seen|saw the queen|queen present|found the queen|spotted the queen/.test(t)) {
    if (!findings.queen.includes("seen")) findings.queen.push("seen");
  }
  if (/\beggs?\b/.test(t) && !/no eggs/.test(t)) {
    if (!findings.queen.includes("eggs")) findings.queen.push("eggs");
  }
  if (/no queen|queen not found|couldn.t find|can.t find queen|missing queen|didn.t see queen/.test(t)) {
    if (!findings.queen.includes("not_found")) findings.queen.push("not_found");
  }
  if (/queen cell|swarm cell|queen cup|supersedure|queen cups/.test(t)) {
    if (!findings.queen.includes("cells")) findings.queen.push("cells");
  }

  // Brood
  if (/strong brood|solid brood|good brood|great brood|healthy brood|full brood/.test(t)) findings.brood = "strong";
  else if (/medium brood|okay brood|ok brood|decent brood|average brood/.test(t)) findings.brood = "medium";
  else if (/weak brood|poor brood|thin brood|sparse brood|light brood/.test(t)) findings.brood = "weak";
  else if (/spotty brood|spotty pattern|patchy brood|swiss cheese|uneven brood/.test(t)) findings.brood = "spotty";

  // Mites
  if (/no mites|zero mites|mites zero|0 mites|no varroa/.test(t)) findings.mites = "0";
  else if (/one mite|two mites|1 mite|2 mites|one or two|1 or 2/.test(t)) findings.mites = "2";
  else if (/three|four|five|[345] mite/.test(t)) findings.mites = "5";
  else if (/six|seven|eight|nine|ten|[6-9]|10.*mite/.test(t)) findings.mites = "6-10";
  else if (/ten plus|10 plus|many mites|lots of mites|heavy mites|high mite/.test(t)) findings.mites = "10+";

  // Beetles
  if (/no beetle|zero beetle|no hive beetle|without beetle/.test(t)) findings.hiveBeetles = "none";
  else if (/few beetle|some beetle|one or two beetle|couple.*beetle/.test(t)) findings.hiveBeetles = "few";
  else if (/moderate beetle|several beetle|some hive beetle/.test(t)) findings.hiveBeetles = "moderate";
  else if (/heavy beetle|many beetle|lots of beetle|infest/.test(t)) findings.hiveBeetles = "heavy";

  // Temperament
  if (/calm|gentle|docile|peaceful|relaxed|quiet bee/.test(t)) findings.temperament = "calm";
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

const BROOD_LABELS: Record<string, string> = {
  strong: "🐛 Strong brood",
  medium: "🐛 Medium brood",
  weak: "🐛 Weak brood",
  spotty: "🐛 Spotty brood",
};

const MITE_LABELS: Record<string, string> = {
  "0": "🔬 0 mites",
  "2": "🔬 1-2 mites",
  "5": "🔬 3-5 mites",
  "6-10": "🔬 6-10 mites",
  "10+": "🔬 10+ mites",
};

const BEETLE_LABELS: Record<string, string> = {
  none: "🪲 No beetles",
  few: "🪲 Few beetles",
  moderate: "🪲 Moderate beetles",
  heavy: "🪲 Heavy beetles",
};

const TEMP_LABELS: Record<string, string> = {
  calm: "😊 Calm",
  active: "⚡ Active",
  defensive: "😤 Defensive",
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function VoiceLogScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id, source } = useLocalSearchParams<{ id?: string; source?: string }>();
  const hiveId = id ? String(id) : "";
  const sourceScreen = source === "add" ? "add" : "quick";

  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const isListeningRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const fullTranscript = finalTranscript + (interimTranscript ? " " + interimTranscript : "");
  const detected = parseTranscript(fullTranscript);
  const hasDetections = detected.queen.length > 0 || detected.brood || detected.mites || detected.hiveBeetles || detected.temperament;

  // Request permissions on mount
  useEffect(() => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync().then((result) => {
      setHasPermission(result.granted);
    });
    return () => {
      if (isListeningRef.current) ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  // Speech recognition events
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript || "";
    if (event.isFinal) {
      setFinalTranscript((prev) => (prev + " " + transcript).trim());
      setInterimTranscript("");
    } else {
      setInterimTranscript(transcript);
    }
    // Auto-scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  });

  useSpeechRecognitionEvent("end", () => {
    // Restart if still supposed to be listening (handles Android timeouts)
    if (isListeningRef.current) {
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
    } else {
      setIsListening(false);
      setInterimTranscript("");
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech error:", event.error, event.message);
    if (event.error !== "aborted" && event.error !== "no-speech") {
      setIsListening(false);
      isListeningRef.current = false;
    }
  });

  const startListening = async () => {
    if (hasPermission === false) {
      Alert.alert("Microphone Permission", "Please grant microphone access in your device settings.");
      return;
    }
    isListeningRef.current = true;
    setIsListening(true);
    setInterimTranscript("");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
    });
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

  const applyToInspection = () => {
    if (!fullTranscript.trim() && !hasDetections) {
      Alert.alert("Nothing to apply", "Speak something first then tap Apply.");
      return;
    }

    if (sourceScreen === "quick") {
      router.replace({
        pathname: "/hive/inspection/quick",
        params: {
          id: hiveId,
          voiceQueen: detected.queen.join(","),
          voiceBrood: detected.brood,
          voiceMites: detected.mites,
          voiceBeetles: detected.hiveBeetles,
          voiceTemperament: detected.temperament,
        },
      });
    } else {
      router.replace({
        pathname: "/hive/inspection/add",
        params: {
          id: hiveId,
          notes: fullTranscript.trim(),
        },
      });
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.container}>

        {/* Transcript area */}
        <ScrollView
          ref={scrollRef}
          style={S.transcriptScroll}
          contentContainerStyle={S.transcriptContent}
        >
          <Text style={S.transcriptLabel}>TRANSCRIPT</Text>
          {fullTranscript.trim() ? (
            <>
              <Text style={S.transcriptText}>{finalTranscript}</Text>
              {interimTranscript ? (
                <Text style={S.interimText}>{interimTranscript}</Text>
              ) : null}
            </>
          ) : (
            <Text style={S.placeholderText}>
              {isListening
                ? "Listening... speak naturally about your hive 🐝"
                : "Tap the mic button and speak naturally.\n\nTry: \"Queen seen, strong brood, no mites, bees are calm\""}
            </Text>
          )}
        </ScrollView>

        {/* Detected findings */}
        {hasDetections && (
          <View style={S.detectedSection}>
            <Text style={S.detectedLabel}>DETECTED</Text>
            <View style={S.detectedBadges}>
              {detected.queen.map((q) => (
                <View key={q} style={S.badge}>
                  <Text style={S.badgeText}>{QUEEN_LABELS[q] || q}</Text>
                </View>
              ))}
              {detected.brood ? (
                <View style={S.badge}><Text style={S.badgeText}>{BROOD_LABELS[detected.brood]}</Text></View>
              ) : null}
              {detected.mites ? (
                <View style={S.badge}><Text style={S.badgeText}>{MITE_LABELS[detected.mites]}</Text></View>
              ) : null}
              {detected.hiveBeetles ? (
                <View style={S.badge}><Text style={S.badgeText}>{BEETLE_LABELS[detected.hiveBeetles]}</Text></View>
              ) : null}
              {detected.temperament ? (
                <View style={S.badge}><Text style={S.badgeText}>{TEMP_LABELS[detected.temperament]}</Text></View>
              ) : null}
            </View>
          </View>
        )}

        {/* Big mic button */}
        <View style={S.micSection}>
          <Pressable
            onPress={toggleListening}
            style={[S.micButton, isListening && S.micButtonActive]}
          >
            <Text style={S.micEmoji}>{isListening ? "⏹️" : "🎙️"}</Text>
          </Pressable>
          <Text style={S.micLabel}>
            {isListening ? "Tap to stop" : "Tap to speak"}
          </Text>
          {isListening && (
            <View style={S.listeningDot}>
              <Text style={S.listeningText}>● LIVE</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={S.actions}>
          <Pressable onPress={clearTranscript} style={S.clearButton}>
            <Text style={S.clearText}>🗑️ Clear</Text>
          </Pressable>
          <Pressable
            onPress={applyToInspection}
            disabled={!fullTranscript.trim() && !hasDetections}
            style={[S.applyButton, !fullTranscript.trim() && !hasDetections && S.disabledButton]}
          >
            <Text style={S.applyText}>
              {sourceScreen === "quick" ? "Apply to Inspection →" : "Add to Notes →"}
            </Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    container: { flex: 1, paddingHorizontal: theme.spaceMD, paddingBottom: 16 },
    transcriptScroll: { flex: 1, backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, borderWidth: 1, borderColor: theme.border, marginTop: theme.spaceSM },
    transcriptContent: { padding: theme.spaceMD, minHeight: 120 },
    transcriptLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
    transcriptText: { color: theme.textPrimary, fontSize: theme.fontMD, lineHeight: 26 },
    interimText: { color: theme.textMuted, fontSize: theme.fontMD, lineHeight: 26, fontStyle: "italic" },
    placeholderText: { color: theme.textMuted, fontSize: theme.fontSM, lineHeight: 22 },
    detectedSection: { paddingVertical: theme.spaceSM },
    detectedLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
    detectedBadges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    badge: { backgroundColor: theme.bgCardAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.honey },
    badgeText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontXS },
    micSection: { alignItems: "center", paddingVertical: theme.spaceMD },
    micButton: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: theme.bgCard,
      borderWidth: 3, borderColor: theme.honey,
      justifyContent: "center", alignItems: "center",
      elevation: 6,
      shadowColor: theme.honey, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    },
    micButtonActive: {
      backgroundColor: theme.honey,
      borderColor: theme.honeyLight,
    },
    micEmoji: { fontSize: 40 },
    micLabel: { color: theme.textMuted, fontSize: theme.fontSM, fontWeight: "700", marginTop: 10 },
    listeningDot: { marginTop: 6 },
    listeningText: { color: theme.danger, fontWeight: "900", fontSize: theme.fontXS },
    actions: { flexDirection: "row", gap: 10 },
    clearButton: { backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border, flex: 1 },
    clearText: { color: theme.textSecondary, fontWeight: "800", fontSize: theme.fontSM },
    applyButton: { backgroundColor: theme.honey, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", flex: 2 },
    disabledButton: { backgroundColor: theme.textMuted },
    applyText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
  });
}
