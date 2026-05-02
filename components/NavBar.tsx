/**
 * components/NavBar.tsx
 *
 * Reusable navigation bar used on every screen.
 * Handles Android status bar spacing automatically via useSafeAreaInsets.
 * Always shows Back and Home buttons.
 *
 * Usage: <NavBar router={router} />
 */

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "../utils/theme";

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} style={styles.navButton}>
        <Text style={styles.navButtonText}>← Back</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/hive")} style={styles.navButton}>
        <Text style={styles.navButtonText}>🏠 Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    paddingHorizontal: T.spaceMD,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.bgNav,
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
});