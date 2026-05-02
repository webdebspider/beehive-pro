/**
 * app/hive/index.tsx
 *
 * Hive Dashboard — main landing screen of the app.
 * Shows all hives with inspection counts and mentor review alerts.
 * Loads hive + inspection data from Firestore on focus.
 *
 * Design: warm & organic, high contrast for outdoor use.
 */

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
import NavBar from "../../components/NavBar";
import OfflineBanner from "../../components/OfflineBanner";
import { db } from "../../utils/firebase";
import { T } from "../../utils/theme";

type Hive = { id: string; name?: string; location?: string; notes?: string };
type Inspection = { id: string; mentorReview?: boolean; queen?: string; brood?: string; createdAt?: any; date?: string };
type HiveCard = Hive & { inspections: Inspection[]; mentorCount: number; latest?: Inspection };

export default function HiveDashboard() {
  const router = useRouter();
  const [hives, setHives] = useState<HiveCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const hiveSnap = await getDocs(collection(db, "hives"));
      const hiveList: Hive[] = hiveSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Hive, "id">) }));
      const enriched = await Promise.all(
        hiveList.map(async (hive) => {
          const inspSnap = await getDocs(collection(db, "hives", hive.id, "inspections"));
          const inspections: Inspection[] = inspSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inspection, "id">) }));
          inspections.sort((a, b) => getTime(b) - getTime(a));
          return { ...hive, inspections, latest: inspections[0], mentorCount: inspections.filter((i) => i.mentorReview).length };
        })
      );
      enriched.sort((a, b) => b.mentorCount - a.mentorCount);
      setHives(enriched);
    } catch (e) {
      console.log("❌ DASHBOARD LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalMentorCount = hives.reduce((sum, h) => sum + h.mentorCount, 0);
  const totalInspections = hives.reduce((sum, h) => sum + h.inspections.length, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={T.honey} size="large" />
        <Text style={styles.loadingText}>Loading your hives...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <OfflineBanner />
      <NavBar />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🐝</Text>
          <View>
            <Text style={styles.title}>Beehive Pro</Text>
            <Text style={styles.subtitle}>Your apiary at a glance</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{hives.length}</Text>
            <Text style={styles.statLabel}>Hives</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalInspections}</Text>
            <Text style={styles.statLabel}>Inspections</Text>
          </View>
          <View style={[styles.statCard, totalMentorCount > 0 && styles.statCardWarning]}>
            <Text style={[styles.statNumber, totalMentorCount > 0 && styles.statNumberWarning]}>
              {totalMentorCount}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {totalMentorCount > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View>
              <Text style={styles.alertTitle}>Mentor Attention Needed</Text>
              <Text style={styles.alertBody}>
                {totalMentorCount} inspection{totalMentorCount === 1 ? "" : "s"} need review
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable onPress={() => router.push("/hive/add")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>+ Add Hive</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/charts")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>📊 Charts</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>YOUR HIVES</Text>

        {hives.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🪣</Text>
            <Text style={styles.emptyText}>No hives yet.</Text>
            <Text style={styles.emptyHint}>Tap "+ Add Hive" to get started.</Text>
          </View>
        ) : (
          hives.map((hive) => (
            <Pressable
              key={hive.id}
              onPress={() => router.push({ pathname: "/hive/[id]", params: { id: hive.id } })}
              style={[styles.card, hive.mentorCount > 0 && styles.cardAlert]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.hiveIconBox}>
                  <Text style={styles.hiveIcon}>🏠</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.hiveName}>{hive.name || `Hive ${hive.id}`}</Text>
                  <Text style={styles.hiveLocation}>{hive.location || "No location set"}</Text>
                </View>
                <Text style={styles.cardArrow}>→</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{hive.inspections.length} inspections</Text>
                </View>
                {hive.mentorCount > 0 && (
                  <View style={styles.cardBadgeWarning}>
                    <Text style={styles.cardBadgeWarningText}>
                      ⚠️ {hive.mentorCount} review{hive.mentorCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTime(i?: Inspection) {
  if (!i) return 0;
  return i.createdAt?.toDate?.()?.getTime?.() || (i.date ? new Date(i.date).getTime() : 0);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
  loadingText: { color: T.textSecondary, marginTop: 12, fontSize: T.fontSM },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: T.spaceLG },
  headerEmoji: { fontSize: 40 },
  title: { color: T.textPrimary, fontSize: T.fontXL, fontWeight: "900", letterSpacing: 0.5 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: T.spaceMD },
  statCard: { flex: 1, backgroundColor: T.bgCard, padding: 14, borderRadius: T.radiusMD, borderWidth: 1, borderColor: T.border, alignItems: "center" },
  statCardWarning: { borderColor: T.warning, backgroundColor: T.warningBg },
  statNumber: { color: T.honey, fontSize: 28, fontWeight: "900" },
  statNumberWarning: { color: T.honeyLight },
  statLabel: { color: T.textSecondary, fontSize: T.fontXS, fontWeight: "700", marginTop: 2 },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.warningBg, borderWidth: 1, borderColor: T.warning, padding: T.spaceMD, borderRadius: T.radiusMD, marginBottom: T.spaceMD },
  alertIcon: { fontSize: 24 },
  alertTitle: { color: T.honeyLight, fontWeight: "900", fontSize: T.fontMD },
  alertBody: { color: T.textSecondary, fontSize: T.fontSM, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: T.spaceMD },
  primaryButton: { flex: 1, backgroundColor: T.green, padding: 14, borderRadius: T.radiusMD, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: T.fontMD },
  secondaryButton: { flex: 1, backgroundColor: T.bgCardAlt, padding: 14, borderRadius: T.radiusMD, alignItems: "center", borderWidth: 1, borderColor: T.border },
  secondaryButtonText: { color: T.textPrimary, fontWeight: "900", fontSize: T.fontMD },
  sectionLabel: { color: T.textMuted, fontSize: T.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: T.spaceSM, marginTop: T.spaceSM },
  emptyBox: { alignItems: "center", marginTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "800" },
  emptyHint: { color: T.textMuted, fontSize: T.fontSM, marginTop: 6 },
  card: { backgroundColor: T.bgCard, borderRadius: T.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  cardAlert: { borderColor: T.warning },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: T.spaceMD },
  hiveIconBox: { width: 44, height: 44, backgroundColor: T.bgCardAlt, borderRadius: T.radiusSM, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: T.border },
  hiveIcon: { fontSize: 22 },
  cardHeaderText: { flex: 1 },
  hiveName: { color: T.textPrimary, fontWeight: "900", fontSize: T.fontMD },
  hiveLocation: { color: T.textMuted, fontSize: T.fontXS, marginTop: 2 },
  cardArrow: { color: T.honey, fontSize: 18, fontWeight: "900" },
  cardFooter: { flexDirection: "row", gap: 8, paddingHorizontal: T.spaceMD, paddingBottom: T.spaceMD },
  cardBadge: { backgroundColor: T.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  cardBadgeText: { color: T.textSecondary, fontSize: T.fontXS, fontWeight: "700" },
  cardBadgeWarning: { backgroundColor: T.warningBg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: T.warning },
  cardBadgeWarningText: { color: T.honeyLight, fontSize: T.fontXS, fontWeight: "700" },
});