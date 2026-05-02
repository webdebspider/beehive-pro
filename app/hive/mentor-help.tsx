/**
 * app/hive/mentor-help.tsx
 *
 * Mentor Help Screen — builds a shareable inspection summary for mentor review.
 * Loads the latest inspection for the hive and formats it as plain text.
 *
 * Features:
 *  - Copy summary to clipboard
 *  - Open Discord, Telegram, SMS, or phone call
 *
 * Route params:
 *  - id: hive ID
 */

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
import { T } from "../../utils/theme";

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

  useEffect(() => { loadLatest(); }, []);

  const loadLatest = async () => {
    try {
      const snap = await getDocs(collection(db, "hives", hiveId, "inspections"));
      const list = snap.docs.map((doc) => doc.data() as Inspection);
      list.sort((a, b) => getTime(b) - getTime(a));
      setLatest(list[0] || null);
    } catch (e) {
      console.log("❌ LOAD ERROR:", e);
    }
  };

  const getTime = (i: Inspection) =>
    i?.createdAt?.toDate?.()?.getTime?.() || (i?.date ? new Date(i.date).getTime() : 0);

  const buildSummary = () => {
    if (!latest) return "No inspection data available.";
    return `Hive ID: ${hiveId}\n\nQueen: ${latest.queen || "-"}\nBrood: ${latest.brood || "-"}\nMites: ${latest.mites || "-"}\nHive Beetles: ${latest.hiveBeetles || "-"}\n\nNotes:\n${latest.notes || "-"}\n\nPlease review this hive condition.`.trim();
  };

  const copySummary = async () => {
    await Clipboard.setStringAsync(buildSummary());
    Alert.alert("Copied", "Inspection summary copied to clipboard.");
  };

  const openLink = async (url: string) => {
    try { await Linking.openURL(url); }
    catch (e) { console.log("❌ LINK ERROR:", e); }
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
        <Text style={styles.title}>🧑‍🏫 Mentor Help</Text>
        <Text style={styles.subtitle}>Share your latest inspection for expert review</Text>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>INSPECTION SUMMARY</Text>
          <Text style={styles.summaryText}>{buildSummary()}</Text>
        </View>

        {/* Copy */}
        <Pressable onPress={copySummary} style={styles.copyButton}>
          <Text style={styles.copyText}>📋 Copy Summary</Text>
        </Pressable>

        {/* Share options */}
        <Text style={styles.sectionLabel}>SHARE VIA</Text>

        <Pressable onPress={() => openLink("https://discord.com")} style={styles.shareButton}>
          <Text style={styles.shareText}>💬 Open Discord</Text>
        </Pressable>

        <Pressable onPress={() => openLink("https://web.telegram.org")} style={styles.shareButton}>
          <Text style={styles.shareText}>✈️ Open Telegram</Text>
        </Pressable>

        <Pressable onPress={() => openLink("sms:")} style={styles.shareButtonSecondary}>
          <Text style={styles.shareTextSecondary}>💬 Text Message</Text>
        </Pressable>

        <Pressable onPress={() => openLink("tel:")} style={styles.shareButtonSecondary}>
          <Text style={styles.shareTextSecondary}>📞 Call Mentor</Text>
        </Pressable>
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
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD },
  summaryCard: {
    backgroundColor: T.bgCard,
    padding: T.spaceMD,
    borderRadius: T.radiusLG,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: T.spaceSM,
  },
  summaryLabel: {
    color: T.textMuted,
    fontSize: T.fontXS,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: T.spaceSM,
  },
  summaryText: { color: T.textSecondary, lineHeight: 22, fontSize: T.fontSM },
  copyButton: {
    backgroundColor: T.green,
    padding: 14,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginBottom: T.spaceMD,
  },
  copyText: { color: "#fff", fontWeight: "900", fontSize: T.fontSM },
  sectionLabel: {
    color: T.textMuted,
    fontSize: T.fontXS,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: T.spaceSM,
  },
  shareButton: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginBottom: 10,
  },
  shareText: { color: "#fff", fontWeight: "900", fontSize: T.fontSM },
  shareButtonSecondary: {
    backgroundColor: T.bgCardAlt,
    padding: 14,
    borderRadius: T.radiusMD,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  shareTextSecondary: { color: T.textPrimary, fontWeight: "900", fontSize: T.fontSM },
});