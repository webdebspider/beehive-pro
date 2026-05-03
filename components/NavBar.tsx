/**
 * components/NavBar.tsx
 *
 * Reusable navigation bar used on every screen.
 * Handles Android status bar spacing via useSafeAreaInsets.
 * Responds to global theme settings.
 *
 * Fix: Home button now calls router.dismissAll() before replace("/hive")
 * to prevent Android landing on the last-visited child route (e.g. /hive/charts).
 */

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../hooks/useAppTheme";

export default function NavBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const S = makeStyles(theme);

  const goHome = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/hive");
  };

  return (
    <View style={[S.navBar, { paddingTop: insets.top + 8 }]}>
      <View style={S.leftButtons}>
        <Pressable onPress={() => router.back()} style={S.navButton}>
          <Text style={S.navButtonText}>← Back</Text>
        </Pressable>
        <Pressable onPress={goHome} style={S.navButton}>
          <Text style={S.navButtonText}>🏠 Home</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push("/settings")} style={S.settingsButton}>
        <Text style={S.settingsText}>⚙️</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spaceMD,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.bgNav,
    },
    leftButtons: {
      flexDirection: "row",
      gap: 10,
    },
    navButton: {
      backgroundColor: theme.bgCard,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radiusSM,
      borderWidth: 1,
      borderColor: theme.border,
    },
    navButtonText: {
      color: theme.textSecondary,
      fontWeight: "700",
      fontSize: theme.fontSM,
    },
    settingsButton: {
      backgroundColor: theme.bgCard,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radiusSM,
      borderWidth: 1,
      borderColor: theme.border,
    },
    settingsText: { fontSize: 18 },
  });
