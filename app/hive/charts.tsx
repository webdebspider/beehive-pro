/**
 * app/hive/charts.tsx
 *
 * Charts Screen — pest history and health scores by hive.
 */

import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";

type Hive = { id: string; name?: string };
type Inspection = { id: string; mites?: number | string | null; hiveBeetles?: string; queen?: string; brood?: string; temperament?: string; createdAt?: any; date?: string };

export default function ChartsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [hives, setHives] = useState<Hive[]>([]);
  const [data, setData] = useState<Record<string, Inspection[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const hiveSnap = await getDocs(collection(db, "hives"));
      const hiveList: Hive[] = hiveSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Hive, "id">) }));
      const inspectionMap: Record<string, Inspection[]> = {};
      for (const hive of hiveList) {
        const snap = await getDocs(collection(db, "hives", hive.id, "inspections"));
        const inspections = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Inspection, "id">) }));
        inspections.sort((a, b) => getInspectionTime(b) - getInspectionTime(a));
        inspectionMap[hive.id] = inspections;
      }
      setHives(hiveList);
      setData(inspectionMap);
    } catch (e) {
      console.log("❌ CHART LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading charts...</Text>
      </View>
    );
  }

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>📊 Hive Charts</Text>
        <Text style={S.subtitle}>Pest history and health scores</Text>
        {hives.map((hive) => {
          const inspections = data[hive.id] || [];
          const health = calculateHealth(inspections[0], theme);
          return (
            <View key={hive.id} style={S.card}>
              <View style={S.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={S.hiveName}>{hive.name || hive.id}</Text>
                  <Text style={S.inspCount}>{inspections.length} inspection{inspections.length === 1 ? "" : "s"}</Text>
                </View>
                <View style={[S.healthBadge, { backgroundColor: health.color }]}>
                  <Text style={S.healthScore}>{health.score === null ? "—" : health.score}</Text>
                </View>
              </View>
              <Text style={[S.healthStatus, { color: health.color }]}>{health.status}</Text>
              {inspections.length === 0 ? (
                <Text style={S.noData}>No pest history yet</Text>
              ) : (
                <View style={S.chipRow}>
                  {inspections.map((i) => (
                    <View key={i.id} style={S.chip}>
                      <View style={S.chipTop}>
                        <Text style={S.chipValue}>M {formatMites(i.mites)}</Text>
                        <Text style={S.chipValue}>SHB {formatBeetles(i.hiveBeetles)}</Text>
                      </View>
                      <Text style={S.chipDate}>{formatShortDate(i)}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                onPress={() => router.push({ pathname: "/hive/[id]", params: { id: hive.id } })}
                style={S.openButton}
              >
                <Text style={S.openText}>Open Hive →</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function getInspectionTime(i: Inspection) { return i.createdAt?.toDate?.()?.getTime?.() || (i.date ? new Date(i.date).getTime() : 0); }
function formatShortDate(i: Inspection) {
  const date = i.createdAt?.toDate?.() || (i.date ? new Date(i.date) : null);
  if (!date) return "no date";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function formatMites(value: Inspection["mites"]) { if (value === null || value === undefined || value === "") return "—"; return String(value); }
function formatBeetles(value?: string) { if (!value) return "—"; if (value === "none") return "0"; if (value === "few") return "few"; if (value === "moderate") return "mod"; if (value === "heavy") return "high"; return value; }
function calculateHealth(inspection: Inspection | undefined, theme: ReturnType<typeof useAppTheme>) {
  if (!inspection) return { score: null as number | null, status: "No inspection yet", color: theme.textMuted };
  let score = 100;
  if (inspection.queen === "not_found") score -= 25;
  if (inspection.queen === "cells") score -= 10;
  if (inspection.brood === "weak") score -= 20;
  if (inspection.brood === "spotty") score -= 15;
  const mites = parseMites(inspection.mites);
  if (mites >= 10) score -= 30; else if (mites >= 6) score -= 20; else if (mites >= 3) score -= 10;
  if (inspection.hiveBeetles === "heavy") score -= 25;
  if (inspection.hiveBeetles === "moderate") score -= 15;
  score = Math.max(0, Math.min(100, score));
  const status = score >= 85 ? "Strong" : score >= 65 ? "Watch" : "Needs Attention";
  const color = score >= 85 ? theme.greenLight : score >= 65 ? theme.honey : theme.danger;
  return { score, status, color };
}
function parseMites(value: Inspection["mites"]) { if (value === null || value === undefined || value === "") return 0; if (typeof value === "number") return value; if (value === "10+") return 10; if (value === "6-10") return 8; const n = Number(value); return Number.isNaN(n) ? 0 : n; }

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceMD },
    card: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    hiveName: { color: theme.textPrimary, fontSize: theme.fontMD, fontWeight: "900" },
    inspCount: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 2 },
    healthBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    healthScore: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
    healthStatus: { fontWeight: "700", fontSize: theme.fontSM, marginBottom: theme.spaceSM },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    chip: { backgroundColor: theme.bgCardAlt, borderColor: theme.border, borderWidth: 1, borderRadius: theme.radiusSM, paddingVertical: 8, paddingHorizontal: 10, minWidth: 100 },
    chipTop: { flexDirection: "row", gap: 10 },
    chipValue: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontXS },
    chipDate: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 4 },
    noData: { color: theme.textMuted, fontStyle: "italic", marginTop: 8 },
    openButton: { backgroundColor: theme.bgCardAlt, padding: 12, borderRadius: theme.radiusSM, marginTop: theme.spaceMD, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    openText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontSM },
  });
}