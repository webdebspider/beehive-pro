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

  const analyzePhoto = async () => {
    setAnalyzing(true);

    // Placeholder for now.
    // Later this will call your secure backend:
    // POST /api/analyze-comb
    setTimeout(() => {
      setResult(
        "AI Comb Review placeholder:\n\nPossible things to look for:\n• Eggs: tiny white grains standing upright\n• Larvae: white curled C-shapes\n• Capped brood: darker capped cells\n• Pollen: colorful packed cells\n• Honey: smooth light caps\n\nThis is not a real AI result yet."
      );
      setAnalyzing(false);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Comb Review</Text>
        <Text style={styles.subtitle}>
          This will help identify eggs, larvae, brood, pollen, honey, and warning signs.
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
            {analyzing ? "Analyzing..." : "Analyze Comb"}
          </Text>
        </Pressable>

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Review Result</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingBottom: 50 },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 6,
    marginBottom: 16,
  },
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
  emptyText: {
    color: "#94a3b8",
  },
  analyzeButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: "#64748b",
  },
  analyzeText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "900",
  },
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
  },
  resultText: {
    color: "#cbd5e1",
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  backText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },
});