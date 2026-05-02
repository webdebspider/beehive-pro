/**
 * app/hive/[id].tsx
 *
 * Hive Detail Screen — shows all inspections for a single hive.
 * Tapping an inspection card navigates to the edit screen.
 * Tapping a photo navigates to the photo viewer.
 * Auto-syncs queued uploads when network is restored.
 */

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
import NavBar from "../../components/NavBar";
import OfflineBanner from "../../components/OfflineBanner";
import { db } from "../../utils/firebase";
import { processSyncQueue } from "../../utils/syncQueue";
import { T } from "../../utils/theme";
import { useNetworkStatus } from "../../utils/useNetworkStatus";

type Inspection = {
  id: string; queen?: string; brood?: string;
  mites?: number | string | null; hiveBeetles?: string;
  notes?: string; photoUrls?: string[]; createdAt?: any;
};

export default function HiveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();

  useEffect(() => { loadInspections(); }, [hiveId]);
  useEffect(() => {
    if (isOnline) processSyncQueue((msg) => console.log("SYNC:", msg));
  }, [isOnline]);

  const loadInspections = async () => {
    if (!hiveId) return;
    try {
      const snap = await getDocs(collection(db, "hives", hiveId, "inspections"));
      const list: Inspection[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      list.sort((a, b) => {
        const t1 = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const t2 = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return t2 - t1;
      });
      setInspections(list);
    } catch (e) {
      console.log("LOAD ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={T.honey} size="large" />
        <Text style={styles.loadingText}>Loading inspections...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <OfflineBanner />
      <NavBar />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Inspections</Text>
          <View style={styles.titleButtons}>
            <Pressable
              style={styles.quickButton}
              onPress={() => router.push({ pathname: "/hive/inspection/quick", params: { id: hiveId } })}
            >
              <Text style={styles.quickButtonText}>⚡ Quick</Text>
            </Pressable>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push({ pathname: "/hive/inspection/add", params: { id: hiveId } })}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          </View>
        </View>

        {inspections.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No inspections yet</Text>
            <Text style={styles.emptyHint}>Tap "+ Add" or "⚡ Quick" to log your first inspection</Text>
          </View>
        )}

        {inspections.map((inspection) => {
          const photos = inspection.photoUrls || [];
          return (
            <Pressable
              key={inspection.id}
              style={styles.card}
              onPress={() => router.push({ pathname: "/hive/inspection/edit", params: { hiveId, inspectionId: inspection.id } })}
            >
              <Text style={styles.cardDate}>
                {inspection.createdAt?.toDate ? inspection.createdAt.toDate().toLocaleString() : "No date"}
              </Text>
              <View style={styles.badgeRow}>
                {inspection.queen ? <View style={styles.badge}><Text style={styles.badgeText}>👑 {inspection.queen}</Text></View> : null}
                {inspection.brood ? <View style={styles.badge}><Text style={styles.badgeText}>🐛 {inspection.brood}</Text></View> : null}
                {inspection.mites !== undefined && inspection.mites !== null && inspection.mites !== "" ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>🔬 {inspection.mites}</Text></View>
                ) : null}
              </View>
              {inspection.notes ? <Text style={styles.notes} numberOfLines={2}>{inspection.notes}</Text> : null}
              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
                  {photos.map((uri) => (
                    <Pressable key={uri} onPress={() => router.push({ pathname: "/hive/photo-viewer", params: { uri, hiveId, inspectionId: inspection.id } })}>
                      <Image source={{ uri }} style={styles.photo} />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <Text style={styles.editHint}>Tap to edit →</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
  loadingText: { color: T.textSecondary, marginTop: 12 },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: T.spaceMD },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900" },
  titleButtons: { flexDirection: "row", gap: 8 },
  quickButton: { backgroundColor: T.bgCardAlt, paddingVertical: 8, paddingHorizontal: 14, borderRadius: T.radiusSM, borderWidth: 1, borderColor: T.honey },
  quickButtonText: { color: T.honey, fontWeight: "900", fontSize: T.fontSM },
  addButton: { backgroundColor: T.green, paddingVertical: 8, paddingHorizontal: 16, borderRadius: T.radiusSM },
  addButtonText: { color: "#fff", fontWeight: "900", fontSize: T.fontSM },
  emptyBox: { alignItems: "center", marginTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: T.textPrimary, fontSize: T.fontMD, fontWeight: "800" },
  emptyHint: { color: T.textMuted, fontSize: T.fontSM, marginTop: 6, textAlign: "center" },
  card: { backgroundColor: T.bgCard, padding: T.spaceMD, borderRadius: T.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  cardDate: { color: T.honey, fontWeight: "700", fontSize: T.fontSM, marginBottom: 8 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  badge: { backgroundColor: T.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  badgeText: { color: T.textSecondary, fontSize: T.fontXS, fontWeight: "700" },
  notes: { color: T.textSecondary, fontSize: T.fontSM, marginBottom: 8, lineHeight: 20 },
  photoStrip: { marginTop: 8, marginBottom: 8 },
  photo: { width: 90, height: 90, borderRadius: T.radiusSM, marginRight: 8 },
  editHint: { color: T.textMuted, fontSize: T.fontXS, textAlign: "right", marginTop: 4 },
});