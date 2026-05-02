import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function PhotoViewerScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  const photoUri = uri ? String(uri) : "";

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/hive/ai-comb",
              params: { uri: photoUri },
            })
          }
          disabled={!photoUri}
          style={[styles.aiButton, !photoUri && styles.disabledButton]}
        >
          <Text style={styles.aiText}>AI Review</Text>
        </Pressable>
      </View>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <Text style={styles.empty}>No photo found.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  backButton: {
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 10,
  },
  backText: {
    color: "#fff",
    fontWeight: "900",
  },
  aiButton: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
  },
  aiText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  disabledButton: {
    backgroundColor: "#64748b",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  empty: {
    color: "#fff",
    textAlign: "center",
    marginTop: 40,
  },
});