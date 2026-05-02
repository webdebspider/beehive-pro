/**
 * app/hive/ai-comb.tsx
 *
 * AI Comb Review Screen — analyzes a comb photo using the Anthropic API.
 * Photo is converted to base64 via expo-file-system before sending.
 * Requires EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
 *
 * TODO: Move API call to backend proxy before public release.
 */

import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: "base64",
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
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
                  text: `You are an expert beekeeper reviewing a photo of honeycomb. Analyze this comb photo and provide a clear, practical report covering:

1. **Eggs** — Do you see any? Describe what you observe.
2. **Larvae** — Open or capped? Healthy C-shape or concerning?
3. **Capped Brood** — Color and pattern? Sunken or perforated caps (signs of disease)?
4. **Honey & Nectar** — Capped or uncapped? Estimated fill level?
5. **Pollen** — Present? Colors visible?
6. **Warning Signs** — Anything concerning (chalkbrood, sacbrood, AFB, varroa signs, laying workers, etc.)?
7. **Overall Assessment** — One sentence summary of hive health based on this frame.

Be concise and practical. If the image is unclear or not a comb photo, say so.`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      if (data.content && data.content[0]?.text) {
        setResult(data.content[0].text);
      } else if (data.error) {
        setError(`API error: ${data.error.message}`);
      } else {
        setError("No result returned. Try again.");
      }
    } catch (e) {
      console.log("AI ANALYZE ERROR", e);
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.navButtonText}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/hive")} style={styles.navButton}>
          <Text style={styles.navButtonText}>🏠 Home</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔬 AI Comb Review</Text>
        <Text style={styles.subtitle}>
          Identifies eggs, larvae, brood, pollen, honey, and warning signs
        </Text>

        {/* Photo or empty state */}
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyText}>No photo selected</Text>
          </View>
        )}

        {/* Analyze button */}
        <Pressable
          onPress={analyzePhoto}
          disabled={!photoUri || analyzing}
          style={[styles.analyzeButton, (!photoUri || analyzing) && styles.disabledButton]}
        >
          <Text style={styles.analyzeText}>
            {analyzing ? "Analyzing... 🐝" : "Analyze Comb"}
          </Text>
        </Pressable>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Result */}
        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>🔍 Review Result</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: T.spaceMD,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.bgNav,
  },
  navButton: {
    backgroundColor: T.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: T.radiusSM,
    borderWidth: 1,
    borderColor: T.border,
  },
  navButtonText: { color: T.textSecondary, fontWeight: "700", fontSize: T.fontSM },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD, lineHeight: 20 },
  photo: {
    width: "100%",
    height: 320,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusLG,
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyBox: {
    height: 200,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusLG,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: T.textMuted, fontSize: T.fontSM },
  analyzeButton: {
    backgroundColor: T.honey,
    padding: 16,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginTop: T.spaceMD,
  },
  disabledButton: { backgroundColor: T.textMuted },
  analyzeText: { color: T.bg, fontWeight: "900", fontSize: T.fontMD },
  errorBox: {
    backgroundColor: T.dangerBg,
    padding: T.spaceMD,
    borderRadius: T.radiusMD,
    marginTop: T.spaceMD,
    borderWidth: 1,
    borderColor: T.danger,
  },
  errorText: { color: "#fca5a5", lineHeight: 20 },
  resultBox: {
    backgroundColor: T.bgCard,
    padding: T.spaceMD,
    borderRadius: T.radiusLG,
    marginTop: T.spaceMD,
    borderWidth: 1,
    borderColor: T.border,
  },
  resultTitle: { color: T.honey, fontWeight: "900", marginBottom: 10, fontSize: T.fontMD },
  resultText: { color: T.textSecondary, lineHeight: 22, fontSize: T.fontSM },
});