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
  location?: string;
  notes?: string;
};

type Inspection = {
  id: string;
  mentorReview?: boolean;
  queen?: string;
  brood?: string;
  mites?: number | string | null;
  hiveBeetles?: string;
  createdAt?: any;
  date?: string;
};

type HiveCard = Hive & {
  inspections: Inspection[];
  mentorCount: number;
  latest?: Inspection;
};

export default function HiveDashboard() {
  const router = useRouter();

  const [hives, setHives] = useState<HiveCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const hiveSnap = await getDocs(collection(db, "hives"));

      const hiveList: Hive[] = hiveSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Hive, "id">),
      }));

      const enriched = await Promise.all(
        hiveList.map(async (hive) => {
          const inspectionSnap = await getDocs(
            collection(db, "hives", hive.id, "inspections")
          );

          const inspections: Inspection[] = inspectionSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Inspection, "id">),
          }));

          inspections.sort((a, b) => getTime(b) - getTime(a));

          return {
            ...hive,
            inspections,
            latest: inspections[0],
            mentorCount: inspections.filter((i) => i.mentorReview).length,
          };
        })
      );

      enriched.sort((a, b) => b.mentorCount - a.mentorCount);

      setHives(enriched);
    } catch (e) {
      console.log("❌ FAST DASHBOARD LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalMentorCount = hives.reduce((sum, hive) => sum + hive.mentorCount, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.meta}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hive Dashboard</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{hives.length}</Text>
            <Text style={styles.statLabel}>Hives</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalMentorCount}</Text>
            <Text style={styles.statLabel}>Mentor Review</Text>
          </View>
        </View>

        {totalMentorCount > 0 && (
          <View style={styles.mentorBox}>
            <Text style={styles.mentorTitle}>⚠️ Mentor Attention Needed</Text>
            <Text style={styles.mentorText}>
              {totalMentorCount} inspection{totalMentorCount === 1 ? "" : "s"} need review.
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Pressable onPress={() => router.push("/hive/add")} style={styles.addButton}>
            <Text style={styles.addText}>+ Add Hive</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/hive/charts")} style={styles.chartButton}>
            <Text style={styles.chartText}>Charts</Text>
          </Pressable>
        </View>

        {hives.length === 0 ? (
          <Text style={styles.meta}>No hives yet.</Text>
        ) : (
          hives.map((hive) => (
            <Pressable
              key={hive.id}
              onPress={() =>
                router.push({
                  pathname: "/hive/[id]",
                  params: { id: hive.id },
                })
              }
              style={[
                styles.card,
                hive.mentorCount > 0 && styles.cardWarning,
              ]}
            >
              <Text style={styles.hiveName}>{hive.name || `Hive ${hive.id}`}</Text>

              <Text style={styles.meta}>
                {hive.location || "No location"}
              </Text>

              <Text style={styles.smallText}>
                Inspections: {hive.inspections.length}
              </Text>

              {hive.mentorCount > 0 && (
                <Text style={styles.warningText}>
                  ⚠️ {hive.mentorCount} mentor review
                  {hive.mentorCount === 1 ? "" : "s"}
                </Text>
              )}

              <Text style={styles.openText}>Open →</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTime(i?: Inspection) {
  if (!i) return 0;

  return (
    i.createdAt?.toDate?.()?.getTime?.() ||
    (i.date ? new Date(i.date).getTime() : 0)
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 50 },
  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 14,
  },
  meta: {
    color: "#9ca3af",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
  },
  statNumber: {
    color: "#22c55e",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  statLabel: {
    color: "#cbd5e1",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 4,
  },
  mentorBox: {
    backgroundColor: "#7f1d1d",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  mentorTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  mentorText: {
    color: "#fecaca",
    marginTop: 4,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
  },
  addText: {
    color: "#0f172a",
    textAlign: "center",
    fontWeight: "900",
  },
  chartButton: {
    flex: 1,
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 10,
  },
  chartText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#1e293b",
  },
  cardWarning: {
    borderColor: "#ef4444",
  },
  hiveName: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  smallText: {
    color: "#cbd5e1",
    marginTop: 8,
    fontWeight: "700",
  },
  warningText: {
    color: "#fecaca",
    marginTop: 8,
    fontWeight: "900",
  },
  openText: {
    color: "#22c55e",
    marginTop: 10,
    fontWeight: "900",
  },
});