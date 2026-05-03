/**
 * app/hive/photo-viewer.tsx
 *
 * Photo Viewer Screen — full screen photo with AI Review and Annotate buttons.
 *
 * Fix: SafeAreaView from react-native-safe-area-context
 * Added: ✏️ Annotate button → navigates to photo-annotate screen
 */

import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAppTheme } from "../../hooks/useAppTheme";

export default function PhotoViewerScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { uri, hiveId, inspectionId } = useLocalSearchParams<{
    uri?: string; hiveId?: string; inspectionId?: string;
  }>();
  const photoUri = uri ? String(uri) : "";
  const parentHiveId = hiveId ? String(hiveId) : "";
  const currentInspectionId = inspectionId ? String(inspectionId) : "";

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <View style={S.navRow}>
        <NavBar />
        <View style={S.buttonGroup}>
          <Pressable
            onPress={() => router.push({
              pathname: "/hive/photo-annotate",
              params: { uri: photoUri, hiveId: parentHiveId, inspectionId: currentInspectionId },
            })}
            disabled={!photoUri}
            style={[S.annotateButton, !photoUri && S.disabledButton]}
          >
            <Text style={S.annotateText}>✏️ Annotate</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({
              pathname: "/hive/ai-comb",
              params: { uri: photoUri, id: parentHiveId, inspectionId: currentInspectionId },
            })}
            disabled={!photoUri}
            style={[S.aiButton, !photoUri && S.disabledButton]}
          >
            <Text style={S.aiText}>🔬 AI Review</Text>
          </Pressable>
        </View>
      </View>

      {photoUri ? (
        <Image source={photoUri} style={S.image} contentFit="contain" />
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
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: theme.spaceMD,
    },
    buttonGroup: { flexDirection: "row", gap: 8 },
    annotateButton: {
      backgroundColor: theme.bgCard,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radiusSM,
      borderWidth: 1,
      borderColor: theme.honeyLight,
    },
    annotateText: { color: theme.honeyLight, fontWeight: "900", fontSize: theme.fontSM },
    aiButton: {
      backgroundColor: theme.honey,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radiusSM,
    },
    aiText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontSM },
    disabledButton: { backgroundColor: theme.textMuted },
    image: { flex: 1, width: "100%" },
    emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textMuted, fontSize: theme.fontMD },
  });
}
