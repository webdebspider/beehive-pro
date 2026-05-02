import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function NavBar({ hiveId }: { hiveId?: string }) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.back()} style={styles.button}>
        <Text style={styles.text}>← Back</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/hive")} style={styles.button}>
        <Text style={styles.text}>🏠 Home</Text>
      </Pressable>

      {hiveId && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/hive/[id]",
              params: { id: hiveId },
            })
          }
          style={styles.button}
        >
          <Text style={styles.text}>🐝 Hive</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#334155",
    padding: 10,
    borderRadius: 8,
  },
  text: {
    color: "#fff",
    fontWeight: "800",
  },
});