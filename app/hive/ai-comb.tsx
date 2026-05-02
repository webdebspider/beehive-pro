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
      // Read photo as base64
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
          model: "claude-opus-4-5",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: base64,
                  },
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
        <Text style={styles.title}>AI Comb Review</Text>
        <Text style={styles.subtitle}>
          Identifies eggs, larvae, brood, pollen, honey, and warning signs.
        </Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No photo selected.</Text>
          </View>
        )}

        <Pressable
          onPress={analyzePhoto}
          disabled={!photoUri || analyzing}
          style={[
            styles.analyzeButton,
            (!photoUri || analyzing) && styles.disabledButton,
          ]}
        >
          <Text style={styles.analyzeText}>
            {analyzing ? "Analyzing... 🐝" : "Analyze Comb"}
          </Text>
        </Pressable>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
  page: { flex: 1, backgroundColor: "#020617" },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  navButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 14,
  },
  content: { padding: 20, paddingBottom: 50 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 6, marginBottom: 16 },
  photo: {
    width: "100%",
    height: 360,
    backgroundColor: "#0f172a",
    borderRadius: 14,
  },
  emptyBox: {
    height: 220,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: "#94a3b8" },
  analyzeButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  disabledButton: { backgroundColor: "#64748b" },
  analyzeText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "#450a0a",
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  errorText: { color: "#fca5a5", lineHeight: 20 },
  resultBox: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  resultTitle: {
    color: "#fff",
    fontWeight: "900",
    marginBottom: 8,
    fontSize: 16,
  },
  resultText: { color: "#cbd5e1", lineHeight: 22 },
});