/**
 * components/NavBar.tsx
 *
 * Reusable navigation bar used on every screen.
 * Handles Android status bar spacing automatically via useSafeAreaInsets.
 * Responds to global theme settings (color scheme, accent, font size).
 */

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../hooks/useAppTheme";

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  return (
    <View style={[
      styles(theme).navBar,
      { paddingTop: insets.top + 8 }
    ]}>
      <Pressable onPress={() => router.back()} style={styles(theme).navButton}>
        <Text style={styles(theme).navButtonText}>← Back</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/hive")} style={styles(theme).navButton}>
        <Text style={styles(theme).navButtonText}>🏠 Home</Text>
      </Pressable>
    </View>
  );
}

const styles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  navBar: {
    flexDirection: "row",
    paddingHorizontal: theme.spaceMD,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bgNav,
  },
  navButton: {
    backgroundColor: theme.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radiusSM,
    borderWidth: 1,
    borderColor: theme.border,
  },
  navButtonText: { color: theme.textSecondary, fontWeight: "700", fontSize: theme.fontSM },
});