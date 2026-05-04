/**
 * app/hive/voice-log.tsx
 *
 * Voice Log Screen — hands-free hive inspection logging.
 * Speak naturally, detected fields shown as badges, tap Save to write
 * directly to Firestore. No routing params needed — eliminates the
 * timing issue of trying to pre-fill another screen.
 *
 * Flow: Speak → detect keywords → review badges → Save Inspection
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
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
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

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
  if (/queen cell|swarm cell|queen cup|supersedure/.test(t)) {
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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function VoiceLogScreen() {
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

  const fullTranscript = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
  const detected = parseTranscript(fullTranscript);
  const hasDetections = detected.queen.length > 0 || detected.brood || detected.mites || detected.hiveBeetles || detected.temperament;

  useEffect(() => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync().then((result) => {
      setHasPermission(result.granted);
    });
    return () => {
      if (isListeningRef.current) ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript || "";
    if (event.isFinal) {
      setFinalTranscript((prev) => (prev + " " + transcript).trim());
      setInterimTranscript("");
    } else {
      setInterimTranscript(transcript);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  });

  useSpeechRecognitionEvent("end", () => {
    if (isListeningRef.current) {
      ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: true });
    } else {
      setIsListening(false);
      setInterimTranscript("");
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
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
    if (!hiveId) { Alert.alert("Error", "No hive ID — go back and try again."); return; }
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

        {/* Transcript */}
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
              {detected.brood ? <View style={S.badge}><Text style={S.badgeText}>🐛 {detected.brood} brood</Text></View> : null}
              {detected.mites ? <View style={S.badge}><Text style={S.badgeText}>🔬 {detected.mites} mites</Text></View> : null}
              {detected.hiveBeetles ? <View style={S.badge}><Text style={S.badgeText}>🪲 {detected.hiveBeetles} beetles</Text></View> : null}
              {detected.temperament ? <View style={S.badge}><Text style={S.badgeText}>😊 {detected.temperament}</Text></View> : null}
            </View>
          </View>
        )}

        {/* Mic button */}
        <View style={S.micSection}>
          <Pressable onPress={toggleListening} style={[S.micButton, isListening && S.micButtonActive]}>
            <Text style={S.micEmoji}>{isListening ? "⏹️" : "🎙️"}</Text>
          </Pressable>
          <Text style={S.micLabel}>{isListening ? "Tap to stop" : "Tap to speak"}</Text>
          {isListening && <Text style={S.listeningText}>● LIVE</Text>}
        </View>

        {/* Actions */}
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
      backgroundColor: theme.bgCard, borderWidth: 3, borderColor: theme.honey,
      justifyContent: "center", alignItems: "center",
      elevation: 6, shadowColor: theme.honey, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    },
    micButtonActive: { backgroundColor: theme.honey, borderColor: theme.honeyLight },
    micEmoji: { fontSize: 40 },
    micLabel: { color: theme.textMuted, fontSize: theme.fontSM, fontWeight: "700", marginTop: 10 },
    listeningText: { color: theme.danger, fontWeight: "900", fontSize: theme.fontXS, marginTop: 6 },
    actions: { flexDirection: "row", gap: 10 },
    clearButton: { backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border, flex: 1 },
    clearText: { color: theme.textSecondary, fontWeight: "800", fontSize: theme.fontSM },
    saveButton: { backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", flex: 2 },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
  });
}
