/**
 * context/SettingsContext.tsx
 *
 * Global settings context — wraps the entire app so any screen
 * can read and update settings without prop drilling.
 *
 * Usage on any screen:
 *   const { settings, updateSettings } = useSettingsContext();
 *
 * When settings change, every screen that uses useSettingsContext()
 * will re-render automatically with the new values.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../utils/settingsStore";

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  /** Resolved color scheme — auto becomes dark or light based on device */
  resolvedScheme: "dark" | "light";
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  resolvedScheme: "dark",
});

/** Wrap the app with this to enable global settings */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const deviceScheme = useColorScheme(); // 'dark' | 'light' | null

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Resolve auto scheme to actual dark/light based on device
  const resolvedScheme: "dark" | "light" =
    settings.colorScheme === "auto"
      ? (deviceScheme ?? "dark")
      : settings.colorScheme;

  /** Update one or more settings and persist to storage */
  const updateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resolvedScheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Hook to access settings from any screen */
export function useSettingsContext() {
  return useContext(SettingsContext);
}