/**
 * app/hive/mentor-help.tsx
 *
 * Mentor Help Screen — builds a shareable inspection summary.
 */

import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

type Inspection = { queen?: string; brood?: string; mites?: string | number; hiveBeetles?: string; notes?: string; date?: string; createdAt?: any };

export default function MentorHelpScreen() {
  const router = useRouter();
  const theme = useAppTheme();
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
    } catch (e) { console.log("❌ LOAD ERROR:", e); }
  };

  const getTime = (i: Inspection) => i?.createdAt?.toDate?.()?.getTime?.() || (i?.date ? new Date(i.date).getTime() : 0);
  const buildSummary = () => {
    if (!latest) return "No inspection data available.";
    return `Hive ID: ${hiveId}\n\nQueen: ${latest.queen || "-"}\nBrood: ${latest.brood || "-"}\nMites: ${latest.mites || "-"}\nHive Beetles: ${latest.hiveBeetles || "-"}\n\nNotes:\n${latest.notes || "-"}\n\nPlease review this hive condition.`.trim();
  };
  const copySummary = async () => { await Clipboard.setStringAsync(buildSummary()); Alert.alert("Copied", "Inspection summary copied to clipboard."); };
  const openLink = async (url: string) => { try { await Linking.openURL(url); } catch (e) { console.log("❌ LINK ERROR:", e); } };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🧑‍🏫 Mentor Help</Text>
        <Text style={S.subtitle}>Share your latest inspection for expert review</Text>
        <View style={S.summaryCard}>
          <Text style={S.summaryLabel}>INSPECTION SUMMARY</Text>
          <Text style={S.summaryText}>{buildSummary()}</Text>
        </View>
        <Pressable onPress={copySummary} style={S.copyButton}><Text style={S.copyText}>📋 Copy Summary</Text></Pressable>
        <Text style={S.sectionLabel}>SHARE VIA</Text>
        <Pressable onPress={() => openLink("https://discord.com")} style={S.shareButton}><Text style={S.shareText}>💬 Open Discord</Text></Pressable>
        <Pressable onPress={() => openLink("https://web.telegram.org")} style={S.shareButton}><Text style={S.shareText}>✈️ Open Telegram</Text></Pressable>
        <Pressable onPress={() => openLink("sms:")} style={S.shareButtonSecondary}><Text style={S.shareTextSecondary}>💬 Text Message</Text></Pressable>
        <Pressable onPress={() => openLink("tel:")} style={S.shareButtonSecondary}><Text style={S.shareTextSecondary}>📞 Call Mentor</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD },
    summaryCard: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, borderWidth: 1, borderColor: theme.border, marginBottom: theme.spaceSM },
    summaryLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: theme.spaceSM },
    summaryText: { color: theme.textSecondary, lineHeight: 22, fontSize: theme.fontSM },
    copyButton: { backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: theme.spaceMD },
    copyText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    sectionLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: theme.spaceSM },
    shareButton: { backgroundColor: "#4f46e5", padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: 10 },
    shareText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    shareButtonSecondary: { backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: theme.border },
    shareTextSecondary: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontSM },
  });
}