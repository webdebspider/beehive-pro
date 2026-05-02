/**
 * app/hive/photo-viewer.tsx
 *
 * Photo Viewer Screen — full screen photo view with AI Review button.
 * Tapping "AI Review" navigates to the ai-comb screen with the photo URI.
 *
 * Route params:
 *  - uri: photo URL or local URI
 *  - hiveId: parent hive ID
 *  - inspectionId: parent inspection ID
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { T } from "../../utils/theme";

export default function PhotoViewerScreen() {
  const router = useRouter();
  const { uri, hiveId, inspectionId } = useLocalSearchParams<{
    uri?: string;
    hiveId?: string;
    inspectionId?: string;
  }>();

  const photoUri = uri ? String(uri) : "";
  const parentHiveId = hiveId ? String(hiveId) : "";
  const currentInspectionId = inspectionId ? String(inspectionId) : "";

  return (
    <SafeAreaView style={styles.page}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.navButtonText}>← Back</Text>
        </Pressable>

        {/* AI Review button — only active when photo exists */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/hive/ai-comb",
              params: {
                uri: photoUri,
                hiveId: parentHiveId,
                inspectionId: currentInspectionId,
              },
            })
          }
          disabled={!photoUri}
          style={[styles.aiButton, !photoUri && styles.disabledButton]}
        >
          <Text style={styles.aiText}>🔬 AI Review</Text>
        </Pressable>
      </View>

      {/* Full screen photo or empty state */}
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyText}>No photo found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#000" },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: T.spaceMD,
    paddingVertical: 10,
    backgroundColor: T.bgNav,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  navButton: {
    backgroundColor: T.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: T.radiusSM,
    borderWidth: 1,
    borderColor: T.border,
  },
  navButtonText: { color: T.textSecondary, fontWeight: "700", fontSize: T.fontSM },
  aiButton: {
    backgroundColor: T.honey,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: T.radiusSM,
  },
  aiText: { color: T.bg, fontWeight: "900", fontSize: T.fontSM },
  disabledButton: { backgroundColor: T.textMuted },
  image: { flex: 1, width: "100%" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: T.textMuted, fontSize: T.fontMD },
});