/**
 * app/hive/charts.tsx
 *
 * Charts Screen — compact pest history and health scores by hive.
 */

import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { db } from "../../utils/firebase";
import { T } from "../../utils/theme";

type Hive = { id: string; name?: string };
type Inspection = { id: string; mites?: number | string | null; hiveBeetles?: string; queen?: string; brood?: string; temperament?: string; createdAt?: any; date?: string };

export default function ChartsScreen() {
  const router = useRouter();
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
      <View style={styles.center}>
        <ActivityIndicator color={T.honey} size="large" />
        <Text style={styles.loadingText}>Loading charts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Hive Charts</Text>
        <Text style={styles.subtitle}>Pest history and health scores</Text>
        {hives.map((hive) => {
          const inspections = data[hive.id] || [];
          const health = calculateHealth(inspections[0]);
          return (
            <View key={hive.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hiveName}>{hive.name || hive.id}</Text>
                  <Text style={styles.inspCount}>{inspections.length} inspection{inspections.length === 1 ? "" : "s"}</Text>
                </View>
                <View style={[styles.healthBadge, { backgroundColor: health.color }]}>
                  <Text style={styles.healthScore}>{health.score === null ? "—" : health.score}</Text>
                </View>
              </View>
              <Text style={[styles.healthStatus, { color: health.color }]}>{health.status}</Text>
              {inspections.length === 0 ? (
                <Text style={styles.noData}>No pest history yet</Text>
              ) : (
                <View style={styles.chipRow}>
                  {inspections.map((i) => (
                    <View key={i.id} style={styles.chip}>
                      <View style={styles.chipTop}>
                        <Text style={styles.chipValue}>M {formatMites(i.mites)}</Text>
                        <Text style={styles.chipValue}>B {formatBeetles(i.hiveBeetles)}</Text>
                      </View>
                      <Text style={styles.chipDate}>{formatShortDate(i)}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Pressable onPress={() => router.push({ pathname: "/hive/[id]", params: { id: hive.id } })} style={styles.openButton}>
                <Text style={styles.openText}>Open Hive →</Text>
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
function calculateHealth(inspection?: Inspection) {
  if (!inspection) return { score: null as number | null, status: "No inspection yet", color: T.textMuted };
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
  const color = score >= 85 ? T.greenLight : score >= 65 ? T.honey : T.danger;
  return { score, status, color };
}
function parseMites(value: Inspection["mites"]) { if (value === null || value === undefined || value === "") return 0; if (typeof value === "number") return value; if (value === "10+") return 10; if (value === "6-10") return 8; const n = Number(value); return Number.isNaN(n) ? 0 : n; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
  loadingText: { color: T.textSecondary, marginTop: 12 },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceMD },
  card: { backgroundColor: T.bgCard, padding: T.spaceMD, borderRadius: T.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  hiveName: { color: T.textPrimary, fontSize: T.fontMD, fontWeight: "900" },
  inspCount: { color: T.textMuted, fontSize: T.fontXS, marginTop: 2 },
  healthBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  healthScore: { color: T.bg, fontWeight: "900", fontSize: T.fontSM },
  healthStatus: { fontWeight: "700", fontSize: T.fontSM, marginBottom: T.spaceSM },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { backgroundColor: T.bgCardAlt, borderColor: T.border, borderWidth: 1, borderRadius: T.radiusSM, paddingVertical: 8, paddingHorizontal: 10, minWidth: 100 },
  chipTop: { flexDirection: "row", gap: 10 },
  chipValue: { color: T.textPrimary, fontWeight: "800", fontSize: T.fontXS },
  chipDate: { color: T.textMuted, fontSize: T.fontXS, marginTop: 4 },
  noData: { color: T.textMuted, fontStyle: "italic", marginTop: 8 },
  openButton: { backgroundColor: T.bgCardAlt, padding: 12, borderRadius: T.radiusSM, marginTop: T.spaceMD, alignItems: "center", borderWidth: 1, borderColor: T.border },
  openText: { color: T.honey, fontWeight: "800", fontSize: T.fontSM },
});