/**
 * app/index.tsx
 *
 * Root entry point — checks auth state and redirects accordingly.
 * - Logged in → /hive dashboard
 * - Logged out → /login
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";

export default function Index() {
  const { user, loading } = useAuthContext();
  const theme = useAppTheme();

  // Show spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
      </View>
    );
  }

  return <Redirect href={user ? "/hive" : "/login"} />;
}