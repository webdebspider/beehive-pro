/**
 * app/hive/ai-comb.tsx
 *
 * AI Comb Review Screen — analyzes a comb photo using the Anthropic API.
 * Requires EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
 * TODO: Move API call to backend proxy before public release.
 */

import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { T } from "../../utils/theme";

export default function AiCombScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔬 AI Comb Review</Text>
        <Text style={styles.subtitle}>Identifies eggs, larvae, brood, pollen, honey, and warning signs</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyText}>No photo selected</Text>
          </View>
        )}
        <Pressable onPress={analyzePhoto} disabled={!photoUri || analyzing} style={[styles.analyzeButton, (!photoUri || analyzing) && styles.disabledButton]}>
          <Text style={styles.analyzeText}>{analyzing ? "Analyzing... 🐝" : "Analyze Comb"}</Text>
        </Pressable>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        {result ? <View style={styles.resultBox}><Text style={styles.resultTitle}>🔍 Review Result</Text><Text style={styles.resultText}>{result}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD, lineHeight: 20 },
  photo: { width: "100%", height: 320, backgroundColor: T.bgCard, borderRadius: T.radiusLG, borderWidth: 1, borderColor: T.border },
  emptyBox: { height: 200, backgroundColor: T.bgCard, borderRadius: T.radiusLG, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: T.border },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: T.textMuted, fontSize: T.fontSM },
  analyzeButton: { backgroundColor: T.honey, padding: 16, borderRadius: T.radiusMD, alignItems: "center", marginTop: T.spaceMD },
  disabledButton: { backgroundColor: T.textMuted },
  analyzeText: { color: T.bg, fontWeight: "900", fontSize: T.fontMD },
  errorBox: { backgroundColor: T.dangerBg, padding: T.spaceMD, borderRadius: T.radiusMD, marginTop: T.spaceMD, borderWidth: 1, borderColor: T.danger },
  errorText: { color: "#fca5a5", lineHeight: 20 },
  resultBox: { backgroundColor: T.bgCard, padding: T.spaceMD, borderRadius: T.radiusLG, marginTop: T.spaceMD, borderWidth: 1, borderColor: T.border },
  resultTitle: { color: T.honey, fontWeight: "900", marginBottom: 10, fontSize: T.fontMD },
  resultText: { color: T.textSecondary, lineHeight: 22, fontSize: T.fontSM },
});