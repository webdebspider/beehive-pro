/**
 * app/hive/[id].tsx
 *
 * Hive Detail Screen — shows all inspections for a single hive.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
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

type Inspection = {
  id: string; queen?: string; brood?: string;
  mites?: number | string | null; hiveBeetles?: string;
  notes?: string; photoUrls?: string[]; createdAt?: any;
};

export default function HiveDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();

  useEffect(() => { loadInspections(); }, [hiveId]);
  useEffect(() => {
    if (isOnline) processQueue((remaining: number) => console.log("SYNC remaining:", remaining));
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
      <ScrollView contentContainerStyle={S.content}>
        <View style={S.titleRow}>
          <Text style={S.title}>Inspections</Text>
          <View style={S.titleButtons}>
            <Pressable style={S.quickButton} onPress={() => router.push({ pathname: "/hive/inspection/quick", params: { id: hiveId } })}>
              <Text style={S.quickButtonText}>⚡ Quick</Text>
            </Pressable>
            <Pressable
              style={S.combButton}
              onPress={() => router.push({ pathname: "/hive/comb-guide", params: { id: hiveId } })}
            >
              <Text style={S.combButtonText}>🔍 Comb</Text>
            </Pressable>
            <Pressable style={S.addButton} onPress={() => router.push({ pathname: "/hive/inspection/add", params: { id: hiveId } })}>
              <Text style={S.addButtonText}>+ Add</Text>
            </Pressable>
          </View>
        </View>

        {inspections.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>🔍</Text>
            <Text style={S.emptyText}>No inspections yet</Text>
            <Text style={S.emptyHint}>Tap "+ Add" or "⚡ Quick" to log your first inspection</Text>
          </View>
        )}

        {inspections.map((inspection) => {
          const photos = inspection.photoUrls || [];
          return (
            <Pressable key={inspection.id} style={S.card} onPress={() => router.push({ pathname: "/hive/inspection/edit", params: { hiveId, inspectionId: inspection.id } })}>
              <Text style={S.cardDate}>
                {inspection.createdAt?.toDate ? inspection.createdAt.toDate().toLocaleString() : "No date"}
              </Text>
              <View style={S.badgeRow}>
                {inspection.queen ? <View style={S.badge}><Text style={S.badgeText}>👑 {inspection.queen}</Text></View> : null}
                {inspection.brood ? <View style={S.badge}><Text style={S.badgeText}>🐛 {inspection.brood}</Text></View> : null}
                {inspection.mites !== undefined && inspection.mites !== null && inspection.mites !== "" ? (
                  <View style={S.badge}><Text style={S.badgeText}>🔬 {inspection.mites}</Text></View>
                ) : null}
              </View>
              {inspection.notes ? <Text style={S.notes} numberOfLines={2}>{inspection.notes}</Text> : null}
              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.photoStrip}>
                  {photos.map((uri) => (
                    <Pressable key={uri} onPress={() => router.push({ pathname: "/hive/photo-viewer", params: { uri, hiveId, inspectionId: inspection.id } })}>
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
    titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spaceMD },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900" },
    titleButtons: { flexDirection: "row", gap: 8 },
    quickButton: { backgroundColor: theme.bgCardAlt, paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.honey },
    quickButtonText: { color: theme.honey, fontWeight: "900", fontSize: theme.fontSM },
    combButton: { backgroundColor: theme.bgCardAlt, paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.honeyLight },
    combButtonText: { color: theme.honeyLight, fontWeight: "900", fontSize: theme.fontSM },
    addButton: { backgroundColor: theme.green, paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radiusSM },
    addButtonText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
    emptyBox: { alignItems: "center", marginTop: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textPrimary, fontSize: theme.fontMD, fontWeight: "800" },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6, textAlign: "center" },
    card: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusLG, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    cardDate: { color: theme.honey, fontWeight: "700", fontSize: theme.fontSM, marginBottom: 8 },
    badgeRow: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
    badge: { backgroundColor: theme.bgCardAlt, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
    badgeText: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    notes: { color: theme.textSecondary, fontSize: theme.fontSM, marginBottom: 8, lineHeight: 20 },
    photoStrip: { marginTop: 8, marginBottom: 8 },
    photo: { width: 90, height: 90, borderRadius: theme.radiusSM, marginRight: 8 },
    editHint: { color: theme.textMuted, fontSize: theme.fontXS, textAlign: "right", marginTop: 4 },
  });
}