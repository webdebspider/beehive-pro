/**
 * app/hive/photo-viewer.tsx
 *
 * Photo Viewer Screen — full screen photo with AI Review button.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { T } from "../../utils/theme";

export default function PhotoViewerScreen() {
  const router = useRouter();
  const { uri, hiveId, inspectionId } = useLocalSearchParams<{ uri?: string; hiveId?: string; inspectionId?: string }>();
  const photoUri = uri ? String(uri) : "";
  const parentHiveId = hiveId ? String(hiveId) : "";
  const currentInspectionId = inspectionId ? String(inspectionId) : "";

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.navRow}>
        <NavBar />
        <Pressable
          onPress={() => router.push({ pathname: "/hive/ai-comb", params: { uri: photoUri, hiveId: parentHiveId, inspectionId: currentInspectionId } })}
          disabled={!photoUri}
          style={[styles.aiButton, !photoUri && styles.disabledButton]}
        >
          <Text style={styles.aiText}>🔬 AI Review</Text>
        </Pressable>
      </View>
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
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: T.spaceMD },
  aiButton: { backgroundColor: T.honey, paddingVertical: 8, paddingHorizontal: 16, borderRadius: T.radiusSM, marginRight: T.spaceSM },
  aiText: { color: T.bg, fontWeight: "900", fontSize: T.fontSM },
  disabledButton: { backgroundColor: T.textMuted },
  image: { flex: 1, width: "100%" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: T.textMuted, fontSize: T.fontMD },
});