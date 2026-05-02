import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../../utils/firebase";

type Hive = {
  id: string;
  name?: string;
};

type Inspection = {
  id: string;
  mites?: number | string | null;
  hiveBeetles?: string;
  queen?: string;
  brood?: string;
  temperament?: string;
  createdAt?: any;
  date?: string;
};

export default function ChartsScreen() {
  const router = useRouter();

  const [hives, setHives] = useState<Hive[]>([]);
  const [data, setData] = useState<Record<string, Inspection[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hiveSnap = await getDocs(collection(db, "hives"));

      const hiveList: Hive[] = hiveSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Hive, "id">),
      }));

      const inspectionMap: Record<string, Inspection[]> = {};

      for (const hive of hiveList) {
        const snap = await getDocs(
          collection(db, "hives", hive.id, "inspections")
        );

        const inspections = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Inspection, "id">),
        }));

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
        <ActivityIndicator />
        <Text style={styles.meta}>Loading charts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hive Charts</Text>
        <Text style={styles.subtitle}>Compact pest history by hive</Text>

        {hives.map((hive) => {
          const inspections = data[hive.id] || [];
          const latest = inspections[0];
          const health = calculateHealth(latest);

          return (
            <View key={hive.id} style={styles.card}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hiveName}>{hive.name || hive.id}</Text>
                  <Text style={styles.smallMeta}>
                    {inspections.length} inspection
                    {inspections.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.healthBadge,
                    { backgroundColor: health.color },
                  ]}
                >
                  <Text style={styles.healthBadgeText}>
                    {health.score === null ? "—" : health.score}
                  </Text>
                </View>
              </View>

              <Text style={styles.reason}>{health.status}</Text>

              {inspections.length === 0 ? (
                <Text style={styles.noData}>No pest history yet</Text>
              ) : (
                <View style={styles.chipWrap}>
                  {inspections.map((i) => (
                    <View key={i.id} style={styles.pestChip}>
                      <View style={styles.chipTopRow}>
                        <Text style={styles.chipMain}>
                          M {formatMites(i.mites)}
                        </Text>
                        <Text style={styles.chipMain}>
                          B {formatBeetles(i.hiveBeetles)}
                        </Text>
                      </View>

                      <Text style={styles.chipDate}>
                        {formatShortDate(i)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/hive/[id]",
                    params: { id: hive.id },
                  })
                }
                style={styles.openButton}
              >
                <Text style={styles.openText}>Open Hive</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function getInspectionTime(inspection: Inspection) {
  if (inspection.createdAt?.toDate) {
    return inspection.createdAt.toDate().getTime();
  }

  if (inspection.date) {
    return new Date(inspection.date).getTime();
  }

  return 0;
}

function formatShortDate(inspection: Inspection) {
  const date =
    inspection.createdAt?.toDate?.() ||
    (inspection.date ? new Date(inspection.date) : null);

  if (!date) return "no date";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMites(value: Inspection["mites"]) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatBeetles(value?: string) {
  if (!value) return "—";

  if (value === "none") return "0";
  if (value === "few") return "few";
  if (value === "moderate") return "mod";
  if (value === "heavy") return "high";

  return value;
}

function calculateHealth(inspection?: Inspection) {
  if (!inspection) {
    return {
      score: null as number | null,
      status: "No inspection yet",
      color: "#94a3b8",
    };
  }

  let score = 100;

  if (inspection.queen === "not_found") score -= 25;
  if (inspection.queen === "cells") score -= 10;
  if (inspection.brood === "weak") score -= 20;
  if (inspection.brood === "spotty") score -= 15;

  const mites = parseMites(inspection.mites);

  if (mites >= 10) score -= 30;
  else if (mites >= 6) score -= 20;
  else if (mites >= 3) score -= 10;

  if (inspection.hiveBeetles === "heavy") score -= 25;
  if (inspection.hiveBeetles === "moderate") score -= 15;
  if (inspection.temperament === "defensive") score -= 5;

  score = Math.max(0, Math.min(100, score));

  const status =
    score >= 85 ? "Strong" : score >= 65 ? "Watch" : "Needs Attention";

  const color =
    score >= 85 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444";

  return { score, status, color };
}

function parseMites(value: Inspection["mites"]) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  if (value === "10+") return 10;
  if (value === "6-10") return 8;

  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hiveName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  smallMeta: {
    color: "#64748b",
    marginTop: 3,
    fontSize: 12,
  },
  healthBadge: {
    minWidth: 44,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  healthBadgeText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  reason: {
    color: "#cbd5e1",
    marginTop: 8,
    fontWeight: "700",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pestChip: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 104,
  },
  chipTopRow: {
    flexDirection: "row",
    gap: 10,
  },
  chipMain: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  chipDate: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
  },
  noData: {
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 12,
  },
  openButton: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  openText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "800",
  },
  meta: {
    color: "#9ca3af",
    marginTop: 10,
  },
});