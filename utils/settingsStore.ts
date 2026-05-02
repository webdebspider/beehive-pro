/**
 * utils/settingsStore.ts
 *
 * Handles saving and loading all user preferences to/from AsyncStorage.
 * This is the single source of truth for all app settings.
 *
 * Settings:
 *  - colorScheme: 'dark' | 'light' | 'auto'
 *  - accentColor: 'honey' | 'forest' | 'ocean' | 'slate'
 *  - fontSize: 'small' | 'medium' | 'large' | 'xlarge'
 *  - appMode: 'beginner' | 'pro' | 'minimal'
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "app_settings";

export type ColorScheme = "dark" | "light" | "auto";
export type AccentColor = "honey" | "forest" | "ocean" | "slate";
export type FontSize = "small" | "medium" | "large" | "xlarge";
export type AppMode = "beginner" | "pro" | "minimal";

export type AppSettings = {
  colorScheme: ColorScheme;
  accentColor: AccentColor;
  fontSize: FontSize;
  appMode: AppMode;
};

/** Default settings — what the app uses on first launch */
export const DEFAULT_SETTINGS: AppSettings = {
  colorScheme: "dark",
  accentColor: "honey",
  fontSize: "medium",
  appMode: "beginner",
};

/** Load settings from AsyncStorage, falling back to defaults */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Merge with defaults so any missing keys are filled in
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Save settings to AsyncStorage */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.log("❌ SAVE SETTINGS ERROR:", e);
  }
}