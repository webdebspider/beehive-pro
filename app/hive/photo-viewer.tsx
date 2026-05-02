/**
 * app/hive/photo-viewer.tsx
 *
 * Photo Viewer Screen — full screen photo with AI Review button.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";

export default function PhotoViewerScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { uri, hiveId, inspectionId } = useLocalSearchParams<{ uri?: string; hiveId?: string; inspectionId?: string }>();
  const photoUri = uri ? String(uri) : "";
  const parentHiveId = hiveId ? String(hiveId) : "";
  const currentInspectionId = inspectionId ? String(inspectionId) : "";

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <View style={S.navRow}>
        <NavBar />
        <Pressable
          onPress={() => router.push({ pathname: "/hive/ai-comb", params: { uri: photoUri, hiveId: parentHiveId, inspectionId: currentInspectionId } })}
          disabled={!photoUri}
          style={[S.aiButton, !photoUri && S.disabledButton]}
        >
          <Text style={S.aiText}>🔬 AI Review</Text>
        </Pressable>
      </View>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={S.image} resizeMode="contain" />
      ) : (
        <View style={S.emptyBox}>
          <Text style={S.emptyEmoji}>📷</Text>
          <Text style={S.emptyText}>No photo found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: "#000" },
    navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: theme.spaceMD },
    aiButton: { backgroundColor: theme.honey, paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radiusSM, marginRight: theme.spaceSM },
    aiText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
    disabledButton: { backgroundColor: theme.textMuted },
    image: { flex: 1, width: "100%" },
    emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textMuted, fontSize: theme.fontMD },
  });
}