/**
 * app/hive/index.tsx
 *
 * Hive Dashboard — main landing screen of the app.
 * Shows only the current user's hives.
 * Loads hive + inspection data from Firestore on mount.
 *
 * Auth: filters hives by userId so each beekeeper only sees their own.
 */

import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
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
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { logout } from "../../utils/auth";
import { db } from "../../utils/firebase";

type Hive = { id: string; name?: string; location?: string; notes?: string };
type Inspection = { id: string; mentorReview?: boolean; queen?: string; brood?: string; createdAt?: any; date?: string };
type HiveCard = Hive & { inspections: Inspection[]; mentorCount: number; latest?: Inspection };

export default function HiveDashboard() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();
  const [hives, setHives] = useState<HiveCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Only load hives belonging to the current user
      const hiveSnap = await getDocs(
        query(collection(db, "hives"), where("userId", "==", user.uid))
      );

      const hiveList: Hive[] = hiveSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Hive, "id">),
      }));

      const enriched = await Promise.all(
        hiveList.map(async (hive) => {
          const inspSnap = await getDocs(collection(db, "hives", hive.id, "inspections"));
          const inspections: Inspection[] = inspSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Inspection, "id">),
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
      console.log("❌ DASHBOARD LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const totalMentorCount = hives.reduce((sum, h) => sum + h.mentorCount, 0);
  const totalInspections = hives.reduce((sum, h) => sum + h.inspections.length, 0);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: theme.fontSM }}>
          Loading your hives...
        </Text>
      </View>
    );
  }

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <OfflineBanner />
      <NavBar />

      <ScrollView contentContainerStyle={S.content}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerEmoji}>🐝</Text>
            <View>
              <Text style={S.title}>Beehive Pro</Text>
              <Text style={S.subtitle}>Your apiary at a glance</Text>
            </View>
          </View>
          <Pressable onPress={handleLogout} style={S.logoutButton}>
            <Text style={S.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* User email */}
        {user?.email && (
          <Text style={S.userEmail}>Signed in as {user.email}</Text>
        )}

        {/* Stats Row */}
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statNumber}>{hives.length}</Text>
            <Text style={S.statLabel}>Hives</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statNumber}>{totalInspections}</Text>
            <Text style={S.statLabel}>Inspections</Text>
          </View>
          <View style={[S.statCard, totalMentorCount > 0 && S.statCardWarning]}>
            <Text style={[S.statNumber, totalMentorCount > 0 && S.statNumberWarning]}>
              {totalMentorCount}
            </Text>
            <Text style={S.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Mentor Alert Banner */}
        {totalMentorCount > 0 && (
          <View style={S.alertBanner}>
            <Text style={S.alertIcon}>⚠️</Text>
            <View>
              <Text style={S.alertTitle}>Mentor Attention Needed</Text>
              <Text style={S.alertBody}>
                {totalMentorCount} inspection{totalMentorCount === 1 ? "" : "s"} need review
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={S.actionRow}>
          <Pressable onPress={() => router.push("/hive/add")} style={S.primaryButton}>
            <Text style={S.primaryButtonText}>+ Add Hive</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/hive/charts")} style={S.secondaryButton}>
            <Text style={S.secondaryButtonText}>📊 Charts</Text>
          </Pressable>
        </View>

        <Text style={S.sectionLabel}>YOUR HIVES</Text>

        {/* Empty state */}
        {hives.length === 0 ? (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>🪣</Text>
            <Text style={S.emptyText}>No hives yet.</Text>
            <Text style={S.emptyHint}>Tap "+ Add Hive" to get started.</Text>
          </View>
        ) : (
          hives.map((hive) => (
            <Pressable
              key={hive.id}
              onPress={() => router.push({ pathname: "/hive/[id]", params: { id: hive.id } })}
              style={[S.card, hive.mentorCount > 0 && S.cardAlert]}
            >
              <View style={S.cardHeader}>
                <View style={S.hiveIconBox}>
                  <Text style={S.hiveIcon}>🏠</Text>
                </View>
                <View style={S.cardHeaderText}>
                  <Text style={S.hiveName}>{hive.name || `Hive ${hive.id}`}</Text>
                  <Text style={S.hiveLocation}>{hive.location || "No location set"}</Text>
                </View>
                <Text style={S.cardArrow}>→</Text>
              </View>
              <View style={S.cardFooter}>
                <View style={S.cardBadge}>
                  <Text style={S.cardBadgeText}>
                    {hive.inspections.length} inspections
                  </Text>
                </View>
                {hive.mentorCount > 0 && (
                  <View style={S.cardBadgeWarning}>
                    <Text style={S.cardBadgeWarningText}>
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

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spaceSM,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerEmoji: { fontSize: 40 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", letterSpacing: 0.5 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 2 },
    logoutButton: {
      backgroundColor: theme.bgCardAlt,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radiusSM,
      borderWidth: 1,
      borderColor: theme.border,
    },
    logoutText: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "700" },
    userEmail: {
      color: theme.textMuted,
      fontSize: theme.fontXS,
      marginBottom: theme.spaceMD,
      fontStyle: "italic",
    },

    // Stats
    statsRow: { flexDirection: "row", gap: 10, marginBottom: theme.spaceMD },
    statCard: {
      flex: 1,
      backgroundColor: theme.bgCard,
      padding: 14,
      borderRadius: theme.radiusMD,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
    },
    statCardWarning: { borderColor: theme.warning, backgroundColor: theme.warningBg },
    statNumber: { color: theme.honey, fontSize: 28, fontWeight: "900" },
    statNumberWarning: { color: theme.honeyLight },
    statLabel: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700", marginTop: 2 },

    // Alert banner
    alertBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.warningBg,
      borderWidth: 1,
      borderColor: theme.warning,
      padding: theme.spaceMD,
      borderRadius: theme.radiusMD,
      marginBottom: theme.spaceMD,
    },
    alertIcon: { fontSize: 24 },
    alertTitle: { color: theme.honeyLight, fontWeight: "900", fontSize: theme.fontMD },
    alertBody: { color: theme.textSecondary, fontSize: theme.fontSM, marginTop: 2 },

    // Action buttons
    actionRow: { flexDirection: "row", gap: 10, marginBottom: theme.spaceMD },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.green,
      padding: 14,
      borderRadius: theme.radiusMD,
      alignItems: "center",
    },
    primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
    secondaryButton: {
      flex: 1,
      backgroundColor: theme.bgCardAlt,
      padding: 14,
      borderRadius: theme.radiusMD,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryButtonText: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD },

    // Section label
    sectionLabel: {
      color: theme.textMuted,
      fontSize: theme.fontXS,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: theme.spaceSM,
      marginTop: theme.spaceSM,
    },

    // Empty state
    emptyBox: { alignItems: "center", marginTop: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "800" },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6 },

    // Hive cards
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: theme.radiusLG,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    cardAlert: { borderColor: theme.warning },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: theme.spaceMD,
    },
    hiveIconBox: {
      width: 44, height: 44,
      backgroundColor: theme.bgCardAlt,
      borderRadius: theme.radiusSM,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    hiveIcon: { fontSize: 22 },
    cardHeaderText: { flex: 1 },
    hiveName: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD },
    hiveLocation: { color: theme.textMuted, fontSize: theme.fontXS, marginTop: 2 },
    cardArrow: { color: theme.honey, fontSize: 18, fontWeight: "900" },
    cardFooter: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: theme.spaceMD,
      paddingBottom: theme.spaceMD,
    },
    cardBadge: {
      backgroundColor: theme.bgCardAlt,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardBadgeText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    cardBadgeWarning: {
      backgroundColor: theme.warningBg,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.warning,
    },
    cardBadgeWarningText: { color: theme.honeyLight, fontSize: theme.fontXS, fontWeight: "700" },
  });
}