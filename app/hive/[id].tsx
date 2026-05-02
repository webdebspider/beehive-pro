import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../../utils/firebase";

type Inspection = {
  id: string;
  queen?: string;
  brood?: string;
  mites?: number | string | null;
  hiveBeetles?: string;
  temperament?: string;
  notes?: string;
  combFindings?: string[];
  photoUris?: string[];
  photoUrls?: string[];
  mentorReview?: boolean;
  date?: string;
  createdAt?: any;
};

export default function HiveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, [hiveId]);

  const loadInspections = async () => {
    if (!hiveId) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(collection(db, "hives", hiveId, "inspections"));

      const list: Inspection[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Inspection, "id">),
      }));

      list.sort((a, b) => getTime(b) - getTime(a));
      setInspections(list);
    } catch (e) {
      console.log("LOAD INSPECTIONS ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  const latest = inspections[0];
  const health = calculateHealth(latest);
  const alerts = buildAlerts(latest);
  const mentorCount = inspections.filter((item) => item.mentorReview).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.meta}>Loading hive</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hive Detail</Text>
        <Text style={styles.meta}>Hive ID: {hiveId}</Text>

        <View style={[styles.healthCard, { borderColor: health.color }]}>
          <Text style={styles.healthLabel}>Latest Health Score</Text>
          <Text style={[styles.healthScore, { color: health.color }]}>
            {health.score === null ? "No Score" : `${health.score}/100`}
          </Text>
          <Text style={styles.healthStatus}>{health.status}</Text>
          <Text style={styles.healthReason}>{health.reason}</Text>
        </View>

        {mentorCount > 0 ? (
          <View style={styles.mentorBox}>
            <Text style={styles.mentorTitle}>Mentor Review Needed</Text>
            <Text style={styles.mentorText}>
              {mentorCount} inspection{mentorCount === 1 ? "" : "s"} marked for mentor review
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/hive/mentor-help",
              params: { id: hiveId },
            })
          }
          style={styles.mentorHelpButton}
        >
          <Text style={styles.mentorHelpText}>Get Mentor Help</Text>
        </Pressable>

        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Smart Alerts</Text>

          {alerts.length === 0 ? (
            <Text style={styles.alertInfo}>No current alerts</Text>
          ) : (
            alerts.map((alert, index) => (
              <Text
                key={`alert-${index}`}
                style={[
                  styles.alertText,
                  alert.level === "high" && styles.alertHigh,
                  alert.level === "watch" && styles.alertWatch,
                  alert.level === "info" && styles.alertInfo,
                  alert.level === "good" && styles.alertGood,
                ]}
              >
                {`${alert.icon} ${alert.message}`}
              </Text>
            ))
          )}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/hive/inspection/add",
                params: { id: hiveId },
              })
            }
            style={styles.addButton}
          >
            <Text style={styles.addText}>Full Inspection</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/hive/inspection/quick",
                params: { id: hiveId },
              })
            }
            style={styles.quickButton}
          >
            <Text style={styles.quickText}>Quick</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/hive/edit",
              params: { id: hiveId },
            })
          }
          style={styles.editHiveButton}
        >
          <Text style={styles.editHiveText}>Edit Hive</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/hive")} style={styles.backButton}>
          <Text style={styles.backText}>Back to Dashboard</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Inspection History</Text>

        {inspections.length === 0 ? (
          <Text style={styles.meta}>No inspections yet</Text>
        ) : (
          inspections.map((inspection) => {
            const itemHealth = calculateHealth(inspection);
            const photos = getPhotos(inspection);

            return (
              <View
                key={inspection.id}
                style={[
                  styles.card,
                  {
                    borderLeftColor: inspection.mentorReview
                      ? "#ef4444"
                      : itemHealth.color,
                  },
                ]}
              >
                <Text style={styles.date}>{formatInspectionDate(inspection)}</Text>

                {inspection.mentorReview ? (
                  <Text style={styles.mentorCardFlag}>Needs Mentor Review</Text>
                ) : null}

                <Text style={styles.healthLine}>
                  {itemHealth.score === null
                    ? "Health: No Score"
                    : `Health: ${itemHealth.score}/100 (${itemHealth.status})`}
                </Text>

                <Text style={styles.meta}>
                  {`Queen: ${inspection.queen || "-"} | Brood: ${inspection.brood || "-"}`}
                </Text>

                <Text style={styles.meta}>
                  {`Mites: ${formatMites(inspection.mites)} | Beetles: ${inspection.hiveBeetles || "-"}`}
                </Text>

                {Array.isArray(inspection.combFindings) &&
                inspection.combFindings.length > 0 ? (
                  <View style={styles.findingsBox}>
                    <Text style={styles.findingsTitle}>Comb Findings</Text>

                    <View style={styles.findingsRow}>
                      {inspection.combFindings.map((finding) => (
                        <View key={finding} style={styles.findingChip}>
                          <Text style={styles.findingText}>{finding}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {photos.length > 0 ? (
                  <View style={styles.photosBox}>
                    <Text style={styles.photosTitle}>Photos</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.photoRow}>
                        {photos.map((uri) => (
                          <Pressable
                            key={uri}
                            onPress={() =>
                              router.push({
                                pathname: "/hive/photo-viewer",
                                params: { uri },
                              })
                            }
                            style={styles.photoButton}
                          >
                            <Image source={{ uri }} style={styles.photo} />
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {inspection.notes ? (
                  <Text style={styles.notes}>{inspection.notes}</Text>
                ) : null}

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/hive/inspection/edit",
                      params: { id: inspection.id, hiveId },
                    })
                  }
                  style={styles.editButton}
                >
                  <Text style={styles.editText}>Edit Inspection</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getPhotos(inspection: Inspection) {
  if (Array.isArray(inspection.photoUrls) && inspection.photoUrls.length > 0) {
    return inspection.photoUrls;
  }

  if (Array.isArray(inspection.photoUris) && inspection.photoUris.length > 0) {
    return inspection.photoUris;
  }

  return [];
}

function getTime(inspection?: Inspection) {
  if (!inspection) return 0;

  if (inspection.createdAt?.toDate) {
    return inspection.createdAt.toDate().getTime();
  }

  if (inspection.date) {
    const parsed = new Date(inspection.date);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  return 0;
}

function formatInspectionDate(inspection: Inspection) {
  if (inspection.createdAt?.toDate) {
    return inspection.createdAt.toDate().toLocaleString();
  }

  if (inspection.date) {
    const parsed = new Date(inspection.date);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
  }

  return "No date recorded";
}

function formatMites(value: Inspection["mites"]) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function parseMites(value: Inspection["mites"]) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  if (value === "10+") return 10;
  if (value === "6-10") return 8;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function hasFinding(inspection: Inspection | undefined, text: string) {
  if (!inspection || !Array.isArray(inspection.combFindings)) return false;

  return inspection.combFindings.some((finding) =>
    finding.toLowerCase().includes(text.toLowerCase())
  );
}

function calculateHealth(inspection?: Inspection) {
  if (!inspection) {
    return {
      score: null as number | null,
      status: "No data",
      reason: "Add an inspection to calculate hive health",
      color: "#64748b",
    };
  }

  let score = 100;
  const reasons: string[] = [];

  if (inspection.mentorReview) {
    score -= 5;
    reasons.push("mentor review requested");
  }

  if (inspection.queen === "not_found") {
    score -= 25;
    reasons.push("queen not found");
  }

  if (inspection.queen === "cells" || hasFinding(inspection, "queen cells")) {
    score -= 10;
    reasons.push("queen cells seen");
  }

  if (inspection.brood === "weak") {
    score -= 20;
    reasons.push("weak brood");
  }

  if (inspection.brood === "spotty" || hasFinding(inspection, "spotty")) {
    score -= 15;
    reasons.push("spotty brood");
  }

  const mites = parseMites(inspection.mites);

  if (mites >= 10) {
    score -= 30;
    reasons.push("high mite count");
  } else if (mites >= 6) {
    score -= 20;
    reasons.push("mites need attention");
  } else if (mites >= 3) {
    score -= 10;
    reasons.push("mite watch");
  }

  if (inspection.hiveBeetles === "heavy") {
    score -= 25;
    reasons.push("heavy hive beetles");
  }

  if (inspection.hiveBeetles === "moderate") {
    score -= 15;
    reasons.push("moderate hive beetles");
  }

  if (inspection.temperament === "defensive") {
    score -= 5;
    reasons.push("defensive temperament");
  }

  if (hasFinding(inspection, "eggs")) score += 3;
  if (hasFinding(inspection, "larvae")) score += 3;
  if (hasFinding(inspection, "capped brood")) score += 3;
  if (hasFinding(inspection, "pollen")) score += 2;
  if (hasFinding(inspection, "capped honey")) score += 2;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: score >= 85 ? "Strong" : score >= 65 ? "Watch" : "Needs Attention",
    reason: reasons.length ? `Flags: ${reasons.join(", ")}` : "No major flags",
    color: score >= 85 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444",
  };
}

function buildAlerts(inspection?: Inspection) {
  if (!inspection) {
    return [
      {
        level: "info" as const,
        icon: "ℹ️",
        message: "No inspection recorded yet",
      },
    ];
  }

  const alerts: {
    level: "info" | "watch" | "high" | "good";
    icon: string;
    message: string;
  }[] = [];

  if (inspection.mentorReview) {
    alerts.push({
      level: "watch",
      icon: "⚠️",
      message: "Mentor review requested",
    });
  }

  const mites = parseMites(inspection.mites);

  if (inspection.queen === "not_found") {
    alerts.push({ level: "high", icon: "🚨", message: "Queen not found" });
  }

  if (inspection.queen === "cells" || hasFinding(inspection, "queen cells")) {
    alerts.push({ level: "watch", icon: "⚠️", message: "Queen cells seen" });
  }

  if (inspection.brood === "spotty" || hasFinding(inspection, "spotty")) {
    alerts.push({ level: "watch", icon: "⚠️", message: "Spotty brood pattern" });
  }

  if (mites >= 10) {
    alerts.push({ level: "high", icon: "🚨", message: "High mite count" });
  } else if (mites >= 6) {
    alerts.push({ level: "watch", icon: "⚠️", message: "Mite count needs attention" });
  } else if (mites >= 3) {
    alerts.push({ level: "watch", icon: "⚠️", message: "Mite count on watch" });
  }

  if (inspection.hiveBeetles === "heavy") {
    alerts.push({ level: "high", icon: "🚨", message: "Heavy hive beetles" });
  }

  if (inspection.hiveBeetles === "moderate") {
    alerts.push({ level: "watch", icon: "⚠️", message: "Moderate hive beetles" });
  }

  if (hasFinding(inspection, "eggs")) {
    alerts.push({ level: "good", icon: "✅", message: "Eggs seen recently" });
  }

  if (hasFinding(inspection, "larvae")) {
    alerts.push({ level: "good", icon: "✅", message: "Larvae seen" });
  }

  if (hasFinding(inspection, "capped brood")) {
    alerts.push({ level: "good", icon: "✅", message: "Capped brood seen" });
  }

  if (hasFinding(inspection, "pollen")) {
    alerts.push({ level: "good", icon: "✅", message: "Pollen stores seen" });
  }

  if (hasFinding(inspection, "capped honey")) {
    alerts.push({ level: "good", icon: "✅", message: "Capped honey seen" });
  }

  return alerts;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 50 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  meta: { color: "#cbd5e1", marginTop: 4 },
  healthCard: {
    backgroundColor: "#1e293b",
    borderWidth: 2,
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
  },
  healthLabel: { color: "#9ca3af", fontWeight: "700" },
  healthScore: { fontSize: 34, fontWeight: "900", marginTop: 4 },
  healthStatus: { color: "#fff", fontWeight: "800", fontSize: 18 },
  healthReason: { color: "#9ca3af", marginTop: 6 },
  mentorBox: {
    backgroundColor: "#7f1d1d",
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  mentorTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  mentorText: { color: "#fecaca", marginTop: 4, fontWeight: "700" },
  mentorHelpButton: {
    backgroundColor: "#a855f7",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  mentorHelpText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },
  mentorCardFlag: {
    color: "#fecaca",
    backgroundColor: "#7f1d1d",
    padding: 8,
    borderRadius: 8,
    fontWeight: "900",
    marginBottom: 8,
    overflow: "hidden",
  },
  alertBox: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  alertTitle: { color: "#fff", fontWeight: "800", marginBottom: 6 },
  alertText: { fontWeight: "700", marginTop: 4 },
  alertHigh: { color: "#fca5a5" },
  alertWatch: { color: "#fcd34d" },
  alertInfo: { color: "#93c5fd" },
  alertGood: { color: "#86efac" },
  buttonRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
    marginRight: 5,
  },
  addText: { color: "#0f172a", textAlign: "center", fontWeight: "800" },
  quickButton: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 10,
    marginLeft: 5,
  },
  quickText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  editHiveButton: {
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  editHiveText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  backButton: {
    backgroundColor: "#475569",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  backText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 6,
  },
  date: { color: "#93c5fd", fontWeight: "700", marginBottom: 6 },
  healthLine: { color: "#fff", fontWeight: "800", marginBottom: 4 },
  findingsBox: { marginTop: 10 },
  findingsTitle: { color: "#9ca3af", fontSize: 12, marginBottom: 4 },
  findingsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  findingChip: {
    backgroundColor: "#22c55e",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  findingText: { color: "#0f172a", fontSize: 12, fontWeight: "800" },
  photosBox: { marginTop: 12 },
  photosTitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "700",
  },
  photoRow: {
    flexDirection: "row",
  },
  photoButton: {
    marginRight: 8,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: "#0f172a",
  },
  notes: { color: "#fff", marginTop: 8 },
  editButton: {
    marginTop: 10,
    backgroundColor: "#334155",
    padding: 10,
    borderRadius: 8,
  },
  editText: { color: "#fff", textAlign: "center", fontWeight: "800" },
});