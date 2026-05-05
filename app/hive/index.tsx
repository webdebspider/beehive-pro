/**
 * app/hive/index.tsx
 *
 * Hive Dashboard — main landing screen of the app.
 * Shows only the current user's hives.
 *
 * Added: due/overdue status on hive cards, supplies + reminders buttons.
 */

import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import OfflineBanner from "../../components/OfflineBanner";
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { logout } from "../../utils/auth";
import { db } from "../../utils/firebase";
import { DEFAULT_REMINDER_INTERVAL, getDueStatus, DueStatus } from "../../utils/reminders";

type Hive = { id: string; name?: string; location?: string; notes?: string; reminderInterval?: number };
type Inspection = { id: string; mentorReview?: boolean; queen?: string; brood?: string; createdAt?: any; date?: string; };
type HiveCard = Hive & { inspections: Inspection[]; mentorCount: number; latest?: Inspection; dueStatus: DueStatus };

function formatDate(i?: Inspection): string {
  if (!i) return "";
  const d = i.createdAt?.toDate?.() || (i.date ? new Date(i.date) : null);
  if (!d) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function getLatestDate(i?: Inspection): string | null {
  if (!i) return null;
  return i.createdAt?.toDate?.()?.toISOString?.() || i.date || null;
}

export default function HiveDashboard() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();
  const [hives, setHives] = useState<HiveCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const hivesListY = useRef<number>(0);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const hiveSnap = await getDocs(query(collection(db, "hives"), where("userId", "==", user.uid)));
      const hiveList: Hive[] = hiveSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Hive, "id">) }));
      const enriched = await Promise.all(
        hiveList.map(async (hive) => {
          const inspSnap = await getDocs(collection(db, "hives", hive.id, "inspections"));
          const inspections: Inspection[] = inspSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inspection, "id">) }));
          inspections.sort((a, b) => getTime(b) - getTime(a));
          const latest = inspections[0];
          const interval = hive.reminderInterval ?? DEFAULT_REMINDER_INTERVAL;
          const dueStatus = getDueStatus(getLatestDate(latest), interval);
          return { ...hive, inspections, latest, mentorCount: inspections.filter((i) => i.mentorReview).length, dueStatus };
        })
      );
      enriched.sort((a, b) => b.mentorCount - a.mentorCount);
      setHives(enriched);
    } catch (e) { console.log("❌ DASHBOARD LOAD ERROR:", e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [user]);
  const handleLogout = async () => { await logout(); router.replace("/login"); };
  const scrollToHives = () => { scrollRef.current?.scrollTo({ y: hivesListY.current, animated: true }); };

  const totalMentorCount = hives.reduce((sum, h) => sum + h.mentorCount, 0);
  const totalInspections = hives.reduce((sum, h) => sum + h.inspections.length, 0);
  const overdueCount = hives.filter((h) => h.dueStatus === "overdue").length;
  const dueSoonCount = hives.filter((h) => h.dueStatus === "due_soon").length;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: theme.fontSM }}>Loading your hives...</Text>
      </View>
    );
  }

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <OfflineBanner />
      <NavBar />
      <ScrollView ref={scrollRef} contentContainerStyle={S.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.honey} colors={[theme.honey]} />}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerEmoji}>🐝</Text>
            <View>
              <Text style={S.title}>Beehive Pro+</Text>
              <Text style={S.subtitle}>Your apiary at a glance</Text>
            </View>
          </View>
          <Pressable onPress={handleLogout} style={S.logoutButton}>
            <Text style={S.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={S.statsRow}>
          <Pressable onPress={scrollToHives} style={S.statCard}>
            <Text style={S.statNumber}>{hives.length}</Text>
            <Text style={S.statLabel}>Hives</Text>
            <Text style={S.statHint}>↓ view</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/charts")} style={S.statCard}>
            <Text style={S.statNumber}>{totalInspections}</Text>
            <Text style={S.statLabel}>Inspections</Text>
            <Text style={S.statHint}>→ charts</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/reminders")} style={[S.statCard, overdueCount > 0 && S.statCardWarning]}>
            <Text style={[S.statNumber, overdueCount > 0 && S.statNumberWarning]}>{overdueCount}</Text>
            <Text style={S.statLabel}>Overdue</Text>
            <Text style={[S.statHint, overdueCount > 0 && S.statHintWarning]}>→ remind</Text>
          </Pressable>
        </View>

        {/* Alerts */}
        {overdueCount > 0 && (
          <View style={S.alertBanner}>
            <Text style={S.alertIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.alertTitle}>{overdueCount} Hive{overdueCount > 1 ? "s" : ""} Overdue for Inspection</Text>
              <Text style={S.alertBody}>{dueSoonCount > 0 ? `${dueSoonCount} more due soon` : "Check your hives soon"}</Text>
            </View>
          </View>
        )}
        {totalMentorCount > 0 && (
          <View style={S.alertBanner}>
            <Text style={S.alertIcon}>👩‍🏫</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.alertTitle}>Mentor Attention Needed</Text>
              <Text style={S.alertBody}>{totalMentorCount} inspection{totalMentorCount === 1 ? "" : "s"} flagged for review</Text>
            </View>
          </View>
        )}

        {/* Action row */}
        <View style={S.actionRow}>
          <Pressable onPress={() => router.push("/hive/add")} style={S.primaryButton}>
            <Text style={S.primaryButtonText}>+ Add Hive</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/charts")} style={S.secondaryButton}>
            <Text style={S.secondaryButtonText}>📊 Charts</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/forage-map")} style={S.secondaryButton}>
            <Text style={S.secondaryButtonText}>🗺️ Forage</Text>
          </Pressable>
        </View>
        <View style={S.actionRow}>
          <Pressable onPress={() => router.push("/hive/reminders")} style={S.secondaryButton}>
            <Text style={S.secondaryButtonText}>🔔 Reminders</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/supplies")} style={S.secondaryButton}>
            <Text style={S.secondaryButtonText}>🧰 Supplies</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/registration")} style={S.secondaryButton}>
            <Text style={S.secondaryButtonText}>🏛️ Register</Text>
          </Pressable>
        </View>

        {/* Hive list */}
        <Text style={S.sectionLabel} onLayout={(e) => { hivesListY.current = e.nativeEvent.layout.y; }}>YOUR HIVES</Text>

        {hives.length === 0 ? (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>🪣</Text>
            <Text style={S.emptyText}>No hives yet</Text>
            <Text style={S.emptyHint}>Tap "+ Add Hive" to get started.</Text>
            <Pressable onPress={() => router.push("/hive/add")} style={S.emptyButton}>
              <Text style={S.emptyButtonText}>+ Add Your First Hive</Text>
            </Pressable>
          </View>
        ) : (
          hives.map((hive) => {
            const latestDate = formatDate(hive.latest);
            const dueColor = hive.dueStatus === "overdue" ? theme.danger
              : hive.dueStatus === "due_soon" ? theme.warning
              : hive.dueStatus === "never_inspected" ? theme.textMuted
              : theme.green;
            const dueLabel = hive.dueStatus === "overdue" ? "⚠️ Overdue"
              : hive.dueStatus === "due_soon" ? "🔔 Due Soon"
              : hive.dueStatus === "never_inspected" ? "🔍 Never Inspected"
              : "✅ OK";

            return (
              <Pressable key={hive.id} onPress={() => router.push({ pathname: "/hive/[id]", params: { id: hive.id } })} style={[S.card, hive.mentorCount > 0 && S.cardAlert, hive.dueStatus === "overdue" && S.cardOverdue]}>
                <View style={S.cardHeader}>
                  <View style={S.hiveIconBox}>
                    <Text style={S.hiveIcon}>🏠</Text>
                  </View>
                  <View style={S.cardHeaderText}>
                    <Text style={S.hiveName}>{hive.name && hive.name.trim() ? hive.name : "Unnamed Hive"}</Text>
                    <Text style={S.hiveLocation}>{hive.location || "No location set"}</Text>
                  </View>
                  <View style={[S.dueBadge, { borderColor: dueColor, backgroundColor: dueColor + "22" }]}>
                    <Text style={[S.dueText, { color: dueColor }]}>{dueLabel}</Text>
                  </View>
                </View>

                {hive.latest && (
                  <View style={S.lastInspection}>
                    <Text style={S.lastInspectionDate}>Last inspected: {latestDate}</Text>
                    {(hive.latest.queen || hive.latest.brood) && (
                      <View style={S.lastInspectionBadges}>
                        {hive.latest.queen ? <View style={S.miniBadge}><Text style={S.miniBadgeText}>👑 {hive.latest.queen}</Text></View> : null}
                        {hive.latest.brood ? <View style={S.miniBadge}><Text style={S.miniBadgeText}>🐛 {hive.latest.brood}</Text></View> : null}
                      </View>
                    )}
                  </View>
                )}

                <View style={S.cardFooter}>
                  <View style={S.cardBadge}>
                    <Text style={S.cardBadgeText}>{hive.inspections.length} inspection{hive.inspections.length === 1 ? "" : "s"}</Text>
                  </View>
                  {hive.mentorCount > 0 && (
                    <View style={S.cardBadgeWarning}>
                      <Text style={S.cardBadgeWarningText}>⚠️ {hive.mentorCount} review{hive.mentorCount === 1 ? "" : "s"}</Text>
                    </View>
                  )}
                  {hive.inspections.length === 0 && (
                    <View style={S.cardBadgeEmpty}>
                      <Text style={S.cardBadgeEmptyText}>No inspections yet</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTime(i?: Inspection) {
  if (!i) return 0;
  return i.createdAt?.toDate?.()?.getTime?.() || (i.date ? new Date(i.date).getTime() : 0);
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spaceMD },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerEmoji: { fontSize: 40 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", letterSpacing: 0.5 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 2 },
    logoutButton: { backgroundColor: theme.bgCardAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    logoutText: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700" },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: theme.spaceMD },
    statCard: { flex: 1, backgroundColor: theme.bgCard, padding: 14, borderRadius: theme.radiusMD, borderWidth: 1, borderColor: theme.border, alignItems: "center" },
    statCardWarning: { borderColor: theme.danger, backgroundColor: theme.dangerBg },
    statNumber: { color: theme.honey, fontSize: 28, fontWeight: "900" },
    statNumberWarning: { color: "#ff6b6b" },
    statLabel: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700", marginTop: 2 },
    statHint: { color: theme.textMuted, fontSize: 10, marginTop: 4, fontWeight: "600" },
    statHintWarning: { color: "#ff6b6b" },
    alertBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.warningBg, borderWidth: 1, borderColor: theme.warning, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginBottom: 10 },
    alertIcon: { fontSize: 24 },
    alertTitle: { color: theme.honeyLight, fontWeight: "900", fontSize: theme.fontSM },
    alertBody: { color: theme.textSecondary, fontSize: theme.fontXS, marginTop: 2 },
    actionRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    primaryButton: { flex: 1.2, backgroundColor: theme.green, padding: 14, borderRadius: theme.radiusMD, alignItems: "center" },
    primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    secondaryButton: { flex: 1, backgroundColor: theme.bgCardAlt, padding: 14, borderRadius: theme.radiusMD, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    secondaryButtonText: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontSM },
    sectionLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: theme.spaceSM, marginTop: theme.spaceSM },
    emptyBox: { alignItems: "center", marginTop: 40, paddingHorizontal: theme.spaceMD },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyText: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "800", marginBottom: 8 },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: 24, textAlign: "center" },
    emptyButton: { backgroundColor: theme.green, paddingVertical: 14, paddingHorizontal: 28, borderRadius: theme.radiusMD },
    emptyButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
    card: { backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
    cardAlert: { borderColor: theme.warning },
    cardOverdue: { borderColor: theme.danger },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: theme.spaceMD, paddingBottom: 8 },
    hiveIconBox: { width: 44, height: 44, backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusSM, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: theme.border },
    hiveIcon: { fontSize: 22 },
    cardHeaderText: { flex: 1 },
    hiveName: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD },
    hiveLocation: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 2 },
    dueBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1 },
    dueText: { fontSize: 10, fontWeight: "800" },
    lastInspection: { paddingHorizontal: theme.spaceMD, paddingBottom: 8, gap: 6 },
    lastInspectionDate: { color: theme.textMuted, fontSize: theme.fontXS },
    lastInspectionBadges: { flexDirection: "row", gap: 6 },
    miniBadge: { backgroundColor: theme.bgCardAlt, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
    miniBadgeText: { color: theme.textSecondary, fontSize: 10, fontWeight: "700" },
    cardFooter: { flexDirection: "row", gap: 8, paddingHorizontal: theme.spaceMD, paddingBottom: theme.spaceMD, flexWrap: "wrap" },
    cardBadge: { backgroundColor: theme.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    cardBadgeText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    cardBadgeWarning: { backgroundColor: theme.warningBg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.warning },
    cardBadgeWarningText: { color: theme.honeyLight, fontSize: theme.fontXS, fontWeight: "700" },
    cardBadgeEmpty: { backgroundColor: theme.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.borderLight },
    cardBadgeEmptyText: { color: theme.textMuted, fontSize: theme.fontXS, fontStyle: "italic" },
  });
}
