/**
 * app/_layout.tsx
 *
 * Root layout — wraps the entire app in SettingsProvider so every
 * screen has access to global settings via useSettingsContext().
 */

import { Stack } from "expo-router";
import { SettingsProvider } from "../context/SettingsContext";

export default function Layout() {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
}