/**
 * app/_layout.tsx
 *
 * Root layout — wraps the entire app in:
 *  - AuthProvider: global Firebase auth state
 *  - SettingsProvider: global app settings (theme, font, mode)
 */

import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext";

export default function Layout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SettingsProvider>
    </AuthProvider>
  );
}