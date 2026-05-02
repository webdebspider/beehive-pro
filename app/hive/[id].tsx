/**
 * app/hive/[id].tsx
 *
 * Hive Detail Screen — shows all inspections for a single hive.
 *
 * Route params:
 *  - id: the Firestore hive document ID (passed from the hive list screen)
 *
 * Features:
 *  - Loads all inspections for the hive from Firestore on mount
 *  - Displays inspections sorted newest first
 *  - Each inspection card is tappable → navigates to edit screen
 *  - Photos in each card are tappable → navigates to photo viewer
 *  - "+ Add Inspection" button routes to the add inspection screen
 *  - Back/Home nav buttons on every screen for consistent navigation
 *  - OfflineBanner shows when device has no internet
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
import OfflineBanner from "../../components/OfflineBanner";
import { db } from "../../utils/firebase";

/** Shape of an inspection document from Firestore */
type Inspection = {
  id: string;
  queen?: string;
  brood?: string;
  mites?: number | string | null;
  hiveBeetles?: string;
  notes?: string;
  photoUrls?: string[];
  createdAt?: any;
};

export default function HiveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hiveId = id ? String(id) : "";

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Load inspections whenever hiveId changes
  useEffect(() => {
    loadInspections();
  }, [hiveId]);

  /**
   * Fetches all inspections for this hive from Firestore.
   * Sorts them newest-first using the createdAt timestamp.
   */
  const loadInspections = async () => {
    if (!hiveId) return;
    try {
      const snap = await getDocs(
        collection(db, "hives", hiveId, "inspections")
      );
      const list: Inspection[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Sort descending by createdAt (newest first)
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
        <ActivityIndicator />
        <Text style={styles.meta}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      {/* Shows amber banner when device is offline */}
      <OfflineBanner />

      {/* Nav Bar — consistent across all screens */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.navButtonText}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/hive")} style={styles.navButton}>
          <Text style={styles.navButtonText}>🏠 Home</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title row with Add Inspection button */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Hive Detail</Text>
          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push({
                pathname: "/hive/inspection/add",
                params: { id: hiveId },
              })
            }
          >
            <Text style={styles.addButtonText}>+ Add Inspection</Text>
          </Pressable>
        </View>

        {/* Empty state when no inspections exist yet */}
        {inspections.length === 0 && (
          <Text style={styles.empty}>No inspections yet. Add one above!</Text>
        )}

        {/* Inspection cards — tap to edit */}
        {inspections.map((inspection) => {
          const photos = inspection.photoUrls || [];

          return (
            <Pressable
              key={inspection.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/hive/inspection/edit",
                  params: { hiveId, inspectionId: inspection.id },
                })
              }
            >
              {/* Date header */}
              <Text style={styles.date}>
                {inspection.createdAt?.toDate
                  ? inspection.createdAt.toDate().toLocaleString()
                  : "No date"}
              </Text>

              {/* Queen and brood summary */}
              <Text style={styles.meta}>
                Queen: {inspection.queen || "-"} | Brood:{" "}
                {inspection.brood || "-"}
              </Text>

              {/* Horizontal photo strip — tap a photo to open full viewer */}
              {photos.length > 0 && (
                <View style={styles.photosBox}>
                  <Text style={styles.photosTitle}>Photos</Text>
                  <ScrollView horizontal>
                    <View style={styles.photoRow}>
                      {photos.map((uri) => (
                        <Pressable
                          key={uri}
                          style={styles.photoButton}
                          onPress={() =>
                            router.push({
                              pathname: "/hive/photo-viewer",
                              params: {
                                uri,
                                hiveId,
                                inspectionId: inspection.id,
                              },
                            })
                          }
                        >
                          <Image source={{ uri }} style={styles.photo} />
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {inspection.notes ? (
                <Text style={styles.notes}>{inspection.notes}</Text>
              ) : null}

              {/* Subtle hint that the card is tappable */}
              <Text style={styles.editHint}>Tap to edit →</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  navButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  navButtonText: { color: "#94a3b8", fontWeight: "700", fontSize: 14 },
  content: { padding: 20 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  addButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: { color: "#0f172a", fontWeight: "800", fontSize: 14 },
  empty: { color: "#64748b", marginTop: 20, textAlign: "center" },
  meta: { color: "#cbd5e1", marginTop: 4 },
  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  date: { color: "#93c5fd", fontWeight: "700", marginBottom: 6 },
  notes: { color: "#fff", marginTop: 6 },
  editHint: { color: "#475569", fontSize: 11, marginTop: 8, textAlign: "right" },
  photosBox: { marginTop: 10 },
  photosTitle: { color: "#9ca3af", fontSize: 12, marginBottom: 6 },
  photoRow: { flexDirection: "row" },
  photoButton: { marginRight: 8 },
  photo: { width: 110, height: 110, borderRadius: 12 },
});