/**
 * app/hive/ai-comb.tsx
 *
 * AI Comb Review Screen — analyzes a comb photo using the Anthropic API.
 */

import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";

export default function AiCombScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const photoUri = uri ? String(uri) : "";
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const analyzePhoto = async () => {
    if (!photoUri) return;
    setAnalyzing(true);
    setResult("");
    setError("");
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: "base64" });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: `You are an expert beekeeper reviewing a photo of honeycomb. Analyze this comb photo and provide a clear, practical report covering:\n\n1. **Eggs** — Do you see any?\n2. **Larvae** — Open or capped? Healthy?\n3. **Capped Brood** — Color and pattern?\n4. **Honey & Nectar** — Capped or uncapped?\n5. **Pollen** — Present?\n6. **Warning Signs** — Anything concerning?\n7. **Overall Assessment** — One sentence summary.\n\nBe concise and practical.` }
          ]}],
        }),
      });
      const data = await response.json();
      if (data.content?.[0]?.text) setResult(data.content[0].text);
      else if (data.error) setError(`API error: ${data.error.message}`);
      else setError("No result returned. Try again.");
    } catch (e) {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🔬 AI Comb Review</Text>
        <Text style={S.subtitle}>Identifies eggs, larvae, brood, pollen, honey, and warning signs</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={S.photo} resizeMode="contain" />
        ) : (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>📷</Text>
            <Text style={S.emptyText}>No photo selected</Text>
          </View>
        )}
        <Pressable onPress={analyzePhoto} disabled={!photoUri || analyzing} style={[S.analyzeButton, (!photoUri || analyzing) && S.disabledButton]}>
          <Text style={S.analyzeText}>{analyzing ? "Analyzing... 🐝" : "Analyze Comb"}</Text>
        </Pressable>
        {error ? <View style={S.errorBox}><Text style={S.errorText}>{error}</Text></View> : null}
        {result ? <View style={S.resultBox}><Text style={S.resultTitle}>🔍 Review Result</Text><Text style={S.resultText}>{result}</Text></View> : null}
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
    analyzeButton: { backgroundColor: theme.honey, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceMD },
    disabledButton: { backgroundColor: theme.textMuted },
    analyzeText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    errorBox: { backgroundColor: theme.dangerBg, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceMD, borderWidth: 1, borderColor: theme.danger },
    errorText: { color: "#fca5a5", lineHeight: 20 },
    resultBox: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, marginTop: theme.spaceMD, borderWidth: 1, borderColor: theme.border },
    resultTitle: { color: theme.honey, fontWeight: "900", marginBottom: 10, fontSize: theme.fontMD },
    resultText: { color: theme.textSecondary, lineHeight: 22, fontSize: theme.fontSM },
  });
}