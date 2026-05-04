/**
 * app/hive/[id].tsx
 *
 * Hive Detail Screen — shows all inspections for a single hive.
 *
 * Added: due/overdue status badge, reminders button, supplies/treatment button.
 * 
 * new added features:
 * feat: reminders + supplies confirmed working on device

- Dashboard showing Beehive Pro+ with due status badges
- Reminders saving to Firestore with per-hive overrides
- Supplies inventory with low stock alerts working
- All screens clean and functional, ready for next round of polish and testing.
 * 
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";
import { processQueue } from "../../utils/syncQueue";
import { useNetworkStatus } from "../../utils/useNetworkStatus";
import { DEFAULT_REMINDER_INTERVAL, getDueLabel, getDueStatus } from "../../utils/reminders";

type Inspection = {
  id: string; queen?: string; brood?: string;
  mites?: number | string | null; hiveBeetles?: string;
  temperament?: string; mentorReview?: boolean;
  notes?: string; photoUrls?: string[]; photoUris?: string[];
  createdAt?: any; date?: string;
};

export default function HiveDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [hiveName, setHiveName] = useState("Hive");
  const [reminderInterval, setReminderInterval] = useState(DEFAULT_REMINDER_INTERVAL);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isOnline = useNetworkStatus();

  useEffect(() => { loadData(); }, [hiveId]);
  useEffect(() => {
    if (isOnline) processQueue((remaining: number) => console.log("SYNC remaining:", remaining));
  }, [isOnline]);

  const loadData = async () => {
    if (!hiveId) return;
    try {
      const hiveDoc = await getDoc(doc(db, "hives", hiveId));
      if (hiveDoc.exists()) {
        const data = hiveDoc.data();
        setHiveName(data.name || "Unnamed Hive");
        setReminderInterval(data.reminderInterval ?? DEFAULT_REMINDER_INTERVAL);
      }
      const snap = await getDocs(collection(db, "hives", hiveId, "inspections"));
      const list: Inspection[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => {
        const t1 = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const t2 = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return t2 - t1;
      });
      setInspections(list);
    } catch (e) { console.log("LOAD ERROR", e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [hiveId]);

  const latestDate = inspections[0]?.createdAt?.toDate?.()?.toISOString?.() || inspections[0]?.date || null;
  const dueStatus = getDueStatus(latestDate, reminderInterval);
  const dueColor = dueStatus === "overdue" ? theme.danger : dueStatus === "due_soon" ? theme.warning : dueStatus === "never_inspected" ? theme.textMuted : theme.green;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading inspections...</Text>
      </View>
    );
  }

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <OfflineBanner />
      <NavBar />
      <ScrollView contentContainerStyle={S.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.honey} colors={[theme.honey]} />}>

        <View style={S.titleSection}>
          <View style={S.titleRow}>
            <Text style={S.title}>Inspections</Text>
            <View style={[S.dueBadge, { borderColor: dueColor, backgroundColor: dueColor + "22" }]}>
              <Text style={[S.dueText, { color: dueColor }]}>{getDueLabel(dueStatus)}</Text>
            </View>
          </View>

          {/* Row 1 */}
          <View style={S.buttonRow}>
            <Pressable style={S.quickButton} onPress={() => router.push({ pathname: "/hive/inspection/quick", params: { id: hiveId } })}>
              <Text style={S.quickButtonText}>⚡ Quick</Text>
            </Pressable>
            <Pressable style={S.voiceButton} onPress={() => router.push({ pathname: "/hive/voice-log", params: { id: hiveId } })}>
              <Text style={S.voiceButtonText}>🎙️ Voice</Text>
            </Pressable>
            <Pressable style={S.addButton} onPress={() => router.push({ pathname: "/hive/inspection/add", params: { id: hiveId } })}>
              <Text style={S.addButtonText}>+ Add</Text>
            </Pressable>
          </View>

          {/* Row 2 */}
          <View style={S.buttonRow}>
            <Pressable style={S.secondaryButton} onPress={() => router.push({ pathname: "/hive/comb-guide", params: { id: hiveId } })}>
              <Text style={S.secondaryButtonText}>🔍 Comb</Text>
            </Pressable>
            <Pressable style={S.secondaryButton} onPress={() => router.push({ pathname: "/hive/forage-log", params: { id: hiveId } })}>
              <Text style={S.secondaryButtonText}>🌿 Forage</Text>
            </Pressable>
            <Pressable style={S.secondaryButton} onPress={() => router.push({ pathname: "/hive/reminders" })}>
              <Text style={S.secondaryButtonText}>🔔 Remind</Text>
            </Pressable>
            <Pressable style={S.secondaryButton} onPress={() => router.push({ pathname: "/hive/supplies", params: { hiveId, hiveName } })}>
              <Text style={S.secondaryButtonText}>🧰 Supplies</Text>
            </Pressable>
          </View>
        </View>

        {inspections.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>🔍</Text>
            <Text style={S.emptyText}>No inspections yet</Text>
            <Text style={S.emptyHint}>Tap "+ Add", "⚡ Quick", or "🎙️ Voice" to log your first inspection</Text>
          </View>
        )}

        {inspections.map((inspection) => {
          const photos = (inspection.photoUrls?.length ? inspection.photoUrls : inspection.photoUris) || [];
          return (
            <Pressable key={inspection.id} style={[S.card, inspection.mentorReview && S.cardMentor]} onPress={() => router.push({ pathname: "/hive/inspection/edit", params: { hiveId, inspectionId: inspection.id } })}>
              <View style={S.cardTopRow}>
                <Text style={S.cardDate}>{inspection.createdAt?.toDate ? inspection.createdAt.toDate().toLocaleString() : "No date"}</Text>
                {inspection.mentorReview && <View style={S.mentorBadge}><Text style={S.mentorBadgeText}>⚠️ Mentor Review</Text></View>}
              </View>
              <View style={S.badgeRow}>
                {inspection.queen ? <View style={S.badge}><Text style={S.badgeText}>👑 {inspection.queen}</Text></View> : null}
                {inspection.brood ? <View style={S.badge}><Text style={S.badgeText}>🐛 {inspection.brood}</Text></View> : null}
                {inspection.mites !== undefined && inspection.mites !== null && inspection.mites !== "" ? <View style={S.badge}><Text style={S.badgeText}>🔬 {inspection.mites}</Text></View> : null}
                {inspection.hiveBeetles && inspection.hiveBeetles !== "none" ? <View style={S.badge}><Text style={S.badgeText}>🪲 {inspection.hiveBeetles}</Text></View> : null}
                {inspection.temperament ? <View style={S.badge}><Text style={S.badgeText}>😊 {inspection.temperament}</Text></View> : null}
              </View>
              {inspection.notes ? <Text style={S.notes} numberOfLines={2}>{inspection.notes}</Text> : null}
              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.photoStrip}>
                  {photos.map((uri) => (
                    <Pressable key={uri} onPress={(e) => { e.stopPropagation(); router.push({ pathname: "/hive/photo-viewer", params: { uri, hiveId, inspectionId: inspection.id } }); }}>
                      <Image source={{ uri }} style={S.photo} />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <Text style={S.editHint}>Tap to edit →</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    titleSection: { marginBottom: theme.spaceMD, gap: 8 },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900" },
    dueBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1 },
    dueText: { fontSize: theme.fontXS, fontWeight: "800" },
    buttonRow: { flexDirection: "row", gap: 6 },
    quickButton: { flex: 1, backgroundColor: theme.bgCardAlt, paddingVertical: 10, alignItems: "center", borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.honey },
    quickButtonText: { color: theme.honey, fontWeight: "900", fontSize: theme.fontXS },
    voiceButton: { flex: 1, backgroundColor: theme.bgCardAlt, paddingVertical: 10, alignItems: "center", borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.honeyLight },
    voiceButtonText: { color: theme.honeyLight, fontWeight: "900", fontSize: theme.fontXS },
    addButton: { flex: 1, backgroundColor: theme.green, paddingVertical: 10, alignItems: "center", borderRadius: theme.radiusSM },
    addButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontXS },
    secondaryButton: { flex: 1, backgroundColor: theme.bgCardAlt, paddingVertical: 10, alignItems: "center", borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    secondaryButtonText: { color: theme.textSecondary, fontWeight: "800", fontSize: theme.fontXS },
    emptyBox: { alignItems: "center", marginTop: 40, paddingHorizontal: theme.spaceMD },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyText: { color: theme.textPrimary, fontSize: theme.fontMD, fontWeight: "800", marginBottom: 8 },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, textAlign: "center", lineHeight: 20 },
    card: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    cardMentor: { borderColor: theme.warning },
    cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    cardDate: { color: theme.honey, fontWeight: "700", fontSize: theme.fontSM },
    mentorBadge: { backgroundColor: theme.warningBg, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.warning },
    mentorBadgeText: { color: theme.honeyLight, fontSize: 10, fontWeight: "800" },
    badgeRow: { flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" },
    badge: { backgroundColor: theme.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    badgeText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    notes: { color: theme.textSecondary, fontSize: theme.fontSM, marginBottom: 8, lineHeight: 20 },
    photoStrip: { marginTop: 8, marginBottom: 8 },
    photo: { width: 90, height: 90, borderRadius: theme.radiusSM, marginRight: 8 },
    editHint: { color: theme.textMuted, fontSize: theme.fontXS, textAlign: "right", marginTop: 4 },
  });
}
