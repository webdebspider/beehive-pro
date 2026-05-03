/**
 * app/hive/mentor-help.tsx
 *
 * Mentor Help Screen — builds a shareable inspection summary and
 * lets the beekeeper share it via the native OS share sheet.
 *
 * Receives: id (hiveId) + inspectionId params
 * If no inspectionId provided, falls back to latest inspection.
 *
 * Share options via native Share sheet (picks up any app the user has):
 *  WhatsApp, Discord, Telegram, iMessage, Email, etc.
 * 
 * jsut a note to self to add a plant note here for the github commit and push test
 * 
 */

import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

type Inspection = {
  id?: string;
  queen?: string;
  brood?: string;
  mites?: string | number;
  hiveBeetles?: string;
  notes?: string;
  date?: string;
  createdAt?: any;
  mentorReview?: boolean;
  mentorFlaggedAt?: any;
};

export default function MentorHelpScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id, inspectionId } = useLocalSearchParams<{ id?: string; inspectionId?: string }>();
  const hiveId = id ? String(id) : "";
  const targetInspectionId = inspectionId ? String(inspectionId) : "";

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInspection(); }, []);

  const loadInspection = async () => {
    try {
      if (targetInspectionId) {
        // Load specific inspection
        const snap = await getDoc(
          doc(db, "hives", hiveId, "inspections", targetInspectionId)
        );
        if (snap.exists()) {
          setInspection({ id: snap.id, ...(snap.data() as Omit<Inspection, "id">) });
        }
      } else {
        // Fall back to latest inspection
        const snap = await getDocs(collection(db, "hives", hiveId, "inspections"));
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inspection, "id">) }));
        list.sort((a, b) => getTime(b) - getTime(a));
        setInspection(list[0] || null);
      }
    } catch (e) {
      console.log("❌ LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTime = (i: Inspection) =>
    i?.createdAt?.toDate?.()?.getTime?.() || (i?.date ? new Date(i.date).getTime() : 0);

  const formatDate = (i: Inspection) => {
    const d = i.createdAt?.toDate?.() || (i.date ? new Date(i.date) : null);
    return d ? d.toLocaleString() : "Unknown date";
  };

  const buildSummary = () => {
    if (!inspection) return "No inspection data available.";
    const lines = [
      `🐝 BEEHIVE PRO — MENTOR REVIEW REQUEST`,
      ``,
      `Hive: ${hiveId}`,
      `Date: ${formatDate(inspection)}`,
      ``,
      `👑 Queen Status: ${inspection.queen || "Not recorded"}`,
      `🐛 Brood Pattern: ${inspection.brood || "Not recorded"}`,
      `🔬 Mite Count: ${inspection.mites ?? "Not recorded"}`,
      `🪲 Hive Beetles: ${inspection.hiveBeetles || "Not recorded"}`,
      ``,
      `📝 Notes:`,
      inspection.notes || "No notes recorded.",
      ``,
      `Please review this hive condition and share your thoughts.`,
      `Sent via Beehive Pro 🐝`,
    ];
    return lines.join("\n");
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: buildSummary(),
        title: "Hive Inspection — Mentor Review",
      });
    } catch (e) {
      console.log("SHARE ERROR:", e);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildSummary());
    Alert.alert("Copied ✓", "Inspection summary copied to clipboard.");
  };

  const S = makeStyles(theme);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading inspection...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🧑‍🏫 Mentor Help</Text>
        <Text style={S.subtitle}>Share this inspection summary with an experienced beekeeper for review</Text>

        {inspection ? (
          <>
            {/* Summary card */}
            <View style={S.summaryCard}>
              <Text style={S.summaryLabel}>INSPECTION SUMMARY</Text>
              <Text style={S.summaryDate}>{formatDate(inspection)}</Text>

              <View style={S.row}>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>👑 Queen</Text>
                  <Text style={S.fieldValue}>{inspection.queen || "—"}</Text>
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>🐛 Brood</Text>
                  <Text style={S.fieldValue}>{inspection.brood || "—"}</Text>
                </View>
              </View>
              <View style={S.row}>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>🔬 Mites</Text>
                  <Text style={S.fieldValue}>{inspection.mites ?? "—"}</Text>
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>🪲 Beetles</Text>
                  <Text style={S.fieldValue}>{inspection.hiveBeetles || "—"}</Text>
                </View>
              </View>

              {inspection.notes ? (
                <View style={S.notesBlock}>
                  <Text style={S.fieldLabel}>📝 Notes</Text>
                  <Text style={S.notesText}>{inspection.notes}</Text>
                </View>
              ) : null}
            </View>

            {/* Primary share action */}
            <Pressable onPress={handleNativeShare} style={S.shareButton}>
              <Text style={S.shareButtonText}>📤 Share with Mentor</Text>
            </Pressable>
            <Text style={S.shareHint}>Opens your apps — WhatsApp, Discord, Telegram, Email, SMS and more</Text>

            {/* Copy fallback */}
            <Pressable onPress={handleCopy} style={S.copyButton}>
              <Text style={S.copyText}>📋 Copy Summary Text</Text>
            </Pressable>

            {/* Back to inspection */}
            {targetInspectionId ? (
              <Pressable
                onPress={() => router.push({ pathname: "/hive/inspection/edit", params: { hiveId, inspectionId: targetInspectionId } })}
                style={S.backButton}
              >
                <Text style={S.backButtonText}>← Back to Inspection</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>🔍</Text>
            <Text style={S.emptyText}>No inspection found</Text>
            <Text style={S.emptyHint}>Go back and add an inspection first</Text>
          </View>
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
    summaryCard: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, borderWidth: 1, borderColor: theme.border, marginBottom: theme.spaceMD },
    summaryLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4 },
    summaryDate: { color: theme.honey, fontSize: theme.fontSM, fontWeight: "700", marginBottom: theme.spaceMD },
    row: { flexDirection: "row", gap: 12, marginBottom: 12 },
    field: { flex: 1, backgroundColor: theme.bgCardAlt, padding: theme.spaceSM, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    fieldLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700", marginBottom: 4 },
    fieldValue: { color: theme.textPrimary, fontSize: theme.fontSM, fontWeight: "800" },
    notesBlock: { backgroundColor: theme.bgCardAlt, padding: theme.spaceSM, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    notesText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20, marginTop: 4 },
    shareButton: { backgroundColor: theme.honey, padding: 18, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: 8 },
    shareButtonText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    shareHint: { color: theme.textMuted, fontSize: theme.fontXS, textAlign: "center", marginBottom: theme.spaceMD },
    copyButton: { backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: theme.border },
    copyText: { color: theme.textSecondary, fontWeight: "900", fontSize: theme.fontSM },
    backButton: { backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 4, borderWidth: 1, borderColor: theme.border },
    backButtonText: { color: theme.textMuted, fontWeight: "700", fontSize: theme.fontSM },
    emptyBox: { alignItems: "center", marginTop: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textPrimary, fontSize: theme.fontMD, fontWeight: "800" },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6 },
  });
}
