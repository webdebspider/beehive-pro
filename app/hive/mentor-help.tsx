import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { db } from "../../utils/firebase";

type Inspection = {
  queen?: string;
  brood?: string;
  mites?: string | number;
  hiveBeetles?: string;
  notes?: string;
  date?: string;
  createdAt?: any;
};

export default function MentorHelpScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [latest, setLatest] = useState<Inspection | null>(null);

  useEffect(() => {
    loadLatest();
  }, []);

  const loadLatest = async () => {
    try {
      const snap = await getDocs(
        collection(db, "hives", hiveId, "inspections")
      );

      const list = snap.docs.map((doc) => doc.data() as Inspection);

      list.sort((a, b) => getTime(b) - getTime(a));

      setLatest(list[0] || null);
    } catch (e) {
      console.log("❌ LOAD ERROR:", e);
    }
  };

  const getTime = (i: Inspection) => {
    return (
      i?.createdAt?.toDate?.()?.getTime?.() ||
      (i?.date ? new Date(i.date).getTime() : 0)
    );
  };

  const buildSummary = () => {
    if (!latest) return "No inspection data available.";

    return `
Hive ID: ${hiveId}

Queen: ${latest.queen || "-"}
Brood: ${latest.brood || "-"}
Mites: ${latest.mites || "-"}
Hive Beetles: ${latest.hiveBeetles || "-"}

Notes:
${latest.notes || "-"}

Please review this hive condition.
`.trim();
  };

  const copySummary = async () => {
    const text = buildSummary();
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Inspection summary copied.");
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.log("❌ LINK ERROR:", e);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mentor Help</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inspection Summary</Text>
          <Text style={styles.summary}>{buildSummary()}</Text>
        </View>

        <Pressable onPress={copySummary} style={styles.copyButton}>
          <Text style={styles.copyText}>Copy Summary</Text>
        </Pressable>

        <Pressable
          onPress={() => openLink("https://discord.com")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Open Discord</Text>
        </Pressable>

        <Pressable
          onPress={() => openLink("https://web.telegram.org")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Open Telegram</Text>
        </Pressable>

        <Pressable
          onPress={() => openLink("sms:")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Text Message</Text>
        </Pressable>

        <Pressable
          onPress={() => openLink("tel:")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Call Mentor</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace({
              pathname: "/hive/[id]",
              params: { id: hiveId },
            })
          }
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back to Hive</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 50 },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
  },

  cardTitle: {
    color: "#fff",
    fontWeight: "900",
    marginBottom: 6,
  },

  summary: {
    color: "#cbd5e1",
    lineHeight: 18,
  },

  copyButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  copyText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "900",
  },

  button: {
    backgroundColor: "#6366f1",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  secondaryText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },

  backButton: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },

  backText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },
});