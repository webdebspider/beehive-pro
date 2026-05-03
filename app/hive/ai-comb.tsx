/**
 * app/hive/ai-comb.tsx
 *
 * AI Comb Review Screen — analyzes a comb photo using the Anthropic API.
 *
 * Fixes:
 *  - expo-file-system imported from legacy path (fixes deprecation warning)
 *  - Web: shows notice and disables analyze for file:// URIs
 *  - SafeAreaView from react-native-safe-area-context
 *  - Updated model to claude-opus-4-6
 *  - Parses result into labeled sections for clean display
 *  - "Add to Inspection" button appears after successful analysis
 */

import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

type ParsedResult = { label: string; emoji: string; text: string };

const SECTION_MAP: { key: string; emoji: string; label: string }[] = [
  { key: "Eggs",         emoji: "🥚", label: "Eggs" },
  { key: "Larvae",       emoji: "🐛", label: "Larvae" },
  { key: "Capped Brood", emoji: "🟫", label: "Capped Brood" },
  { key: "Honey",        emoji: "🍯", label: "Honey & Nectar" },
  { key: "Pollen",       emoji: "🌼", label: "Pollen" },
  { key: "Warning",      emoji: "⚠️", label: "Warning Signs" },
  { key: "Overall",      emoji: "📋", label: "Overall Assessment" },
];

function parseResult(raw: string): ParsedResult[] {
  const sections: ParsedResult[] = [];
  for (const section of SECTION_MAP) {
    const regex = new RegExp(
      `(?:\\d+\\.\\s*)?\\*{0,2}${section.key}[^*\\n]*\\*{0,2}[:\\s—-]+([\\s\\S]*?)(?=(?:\\d+\\.\\s*)?\\*{0,2}(?:${SECTION_MAP.map((s) => s.key).join("|")})|$)`,
      "i"
    );
    const match = raw.match(regex);
    if (match?.[1]?.trim()) {
      sections.push({ label: section.label, emoji: section.emoji, text: match[1].trim() });
    }
  }
  if (sections.length === 0) {
    sections.push({ label: "Analysis", emoji: "🔍", text: raw.trim() });
  }
  return sections;
}

export default function AiCombScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { uri, id } = useLocalSearchParams<{ uri?: string; id?: string }>();
  const photoUri = uri ? String(uri) : "";
  const hiveId = id ? String(id) : "";

  const [analyzing, setAnalyzing] = useState(false);
  const [sections, setSections] = useState<ParsedResult[]>([]);
  const [rawResult, setRawResult] = useState("");
  const [error, setError] = useState("");

  // Web browsers can't access file:// URIs from the Android device
  const isLocalFile = photoUri.startsWith("file://");
  const webBlocked = Platform.OS === "web" && isLocalFile;

  const analyzePhoto = async () => {
    if (!photoUri || webBlocked) return;
    setAnalyzing(true);
    setSections([]);
    setRawResult("");
    setError("");
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: "image/jpeg", data: base64 },
                },
                {
                  type: "text",
                  text: `You are an expert beekeeper reviewing a photo of honeycomb. Analyze this comb photo and provide a clear, practical report covering each section below. Use exactly these section headers:\n\n1. **Eggs** — Do you see any?\n2. **Larvae** — Open or capped? Healthy?\n3. **Capped Brood** — Color and pattern?\n4. **Honey & Nectar** — Capped or uncapped?\n5. **Pollen** — Present?\n6. **Warning Signs** — Anything concerning?\n7. **Overall Assessment** — One sentence summary.\n\nBe concise and practical. 1-2 sentences per section.`,
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.content?.[0]?.text) {
        const raw = data.content[0].text;
        setRawResult(raw);
        setSections(parseResult(raw));
      } else if (data.error) {
        setError(`API error: ${data.error.message}`);
      } else {
        setError("No result returned. Try again.");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const addToInspection = () => {
    if (!rawResult) return;
    router.replace({
      pathname: "/hive/inspection/add",
      params: { id: hiveId, notes: `AI Comb Review:\n${rawResult}` },
    });
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🔬 AI Comb Review</Text>
        <Text style={S.subtitle}>Identifies eggs, larvae, brood, pollen, honey, and warning signs</Text>

        {photoUri ? (
          <Image source={photoUri} style={S.photo} contentFit="contain" />
        ) : (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>📷</Text>
            <Text style={S.emptyText}>No photo selected</Text>
          </View>
        )}

        {webBlocked && (
          <View style={S.webNotice}>
            <Text style={S.webNoticeText}>
              📱 AI analysis for local photos requires the mobile app. Once photos sync to Firebase Storage, AI review will work here too.
            </Text>
          </View>
        )}

        <Pressable
          onPress={analyzePhoto}
          disabled={!photoUri || analyzing || webBlocked}
          style={[S.analyzeButton, (!photoUri || analyzing || webBlocked) && S.disabledButton]}
        >
          {analyzing ? (
            <View style={S.analyzeRow}>
              <ActivityIndicator color={theme.bg} size="small" />
              <Text style={S.analyzeText}>Analyzing... 🐝</Text>
            </View>
          ) : (
            <Text style={S.analyzeText}>
              {webBlocked
                ? "Use Mobile App to Analyze"
                : sections.length > 0
                ? "Re-analyze Comb"
                : "Analyze Comb"}
            </Text>
          )}
        </Pressable>

        {error ? (
          <View style={S.errorBox}>
            <Text style={S.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {sections.length > 0 && (
          <View style={S.resultBox}>
            <Text style={S.resultTitle}>🔍 Review Result</Text>
            {sections.map((section, i) => (
              <View key={i} style={[S.sectionRow, i < sections.length - 1 && S.sectionBorder]}>
                <Text style={S.sectionLabel}>{section.emoji} {section.label}</Text>
                <Text style={S.sectionText}>{section.text}</Text>
              </View>
            ))}
          </View>
        )}

        {sections.length > 0 && (
          <Pressable onPress={addToInspection} style={S.addButton}>
            <Text style={S.addButtonText}>Add to Inspection →</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD, lineHeight: 20 },
    photo: { width: "100%", height: 320, backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, borderWidth: 1, borderColor: theme.border },
    emptyBox: { height: 200, backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: theme.border },
    emptyEmoji: { fontSize: 40, marginBottom: 8 },
    emptyText: { color: theme.textMuted, fontSize: theme.fontSM },
    webNotice: { backgroundColor: theme.bgCardAlt, borderWidth: 1, borderColor: theme.border, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceMD },
    webNoticeText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20 },
    analyzeButton: { backgroundColor: theme.honey, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceMD },
    disabledButton: { backgroundColor: theme.textMuted },
    analyzeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    analyzeText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    errorBox: { backgroundColor: theme.dangerBg, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceMD, borderWidth: 1, borderColor: theme.danger },
    errorText: { color: "#fca5a5", lineHeight: 20 },
    resultBox: { backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, marginTop: theme.spaceMD, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
    resultTitle: { color: theme.honey, fontWeight: "900", fontSize: theme.fontMD, padding: theme.spaceMD, borderBottomWidth: 1, borderBottomColor: theme.border },
    sectionRow: { padding: theme.spaceMD, gap: 4 },
    sectionBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
    sectionLabel: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontSM },
    sectionText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 22 },
    addButton: { backgroundColor: theme.honey, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceMD },
    addButtonText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
  });
}
