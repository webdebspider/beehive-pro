/**
 * hooks/useAppTheme.ts
 *
 * Returns a fully resolved theme object based on the current settings.
 * Combines the base theme (T) with dynamic color scheme, accent color,
 * and font size scaling.
 *
 * Usage on any screen:
 *   const theme = useAppTheme();
 *   // Use theme.bg, theme.honey, theme.fontMD etc instead of T directly
 */

import { useSettingsContext } from "../context/SettingsContext";
import { AccentColor } from "../utils/settingsStore";

// ── Accent color palettes ─────────────────────────────────────────────────────

const ACCENT_COLORS: Record<AccentColor, { honey: string; honeyDark: string; honeyLight: string }> = {
  honey: {
    honey: "#f59e0b",
    honeyDark: "#b45309",
    honeyLight: "#fcd34d",
  },
  forest: {
    honey: "#16a34a",
    honeyDark: "#15803d",
    honeyLight: "#4ade80",
  },
  ocean: {
    honey: "#0ea5e9",
    honeyDark: "#0369a1",
    honeyLight: "#7dd3fc",
  },
  slate: {
    honey: "#94a3b8",
    honeyDark: "#64748b",
    honeyLight: "#cbd5e1",
  },
};

// ── Color schemes ─────────────────────────────────────────────────────────────

const DARK_COLORS = {
  bg:         "#12100e",
  bgCard:     "#1e1a14",
  bgCardAlt:  "#2a2318",
  bgInput:    "#251f17",
  bgNav:      "#1a1510",
  textPrimary:   "#fef3c7",
  textSecondary: "#d4b896",
  textMuted:     "#8a7560",
  border:      "#3d3020",
  borderLight: "#4a3a28",
};

const LIGHT_COLORS = {
  bg:         "#fdf8f0",
  bgCard:     "#fff8ee",
  bgCardAlt:  "#fef3dc",
  bgInput:    "#fff8ee",
  bgNav:      "#fdf0d8",
  textPrimary:   "#1a1008",
  textSecondary: "#5c3d1e",
  textMuted:     "#a07840",
  border:      "#e8d5b0",
  borderLight: "#f0e4c4",
};

// ── Font size scales ──────────────────────────────────────────────────────────

const FONT_SCALES = {
  small:   { XL: 28, LG: 20, MD: 15, SM: 12, XS: 10 },
  medium:  { XL: 32, LG: 24, MD: 17, SM: 14, XS: 12 },
  large:   { XL: 36, LG: 28, MD: 20, SM: 16, XS: 14 },
  xlarge:  { XL: 42, LG: 34, MD: 24, SM: 19, XS: 16 },
};

// ── Static values that never change ──────────────────────────────────────────

const STATIC = {
  green:      "#16a34a",
  greenLight: "#22c55e",
  danger:    "#dc2626",
  dangerBg:  "#450a0a",
  warning:   "#d97706",
  warningBg: "#451a03",
  spaceSM:  8,
  spaceMD:  16,
  spaceLG:  24,
  spaceXL:  32,
  radiusSM: 8,
  radiusMD: 12,
  radiusLG: 16,
};

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useAppTheme() {
  const { settings, resolvedScheme } = useSettingsContext();

  const colors = resolvedScheme === "light" ? LIGHT_COLORS : DARK_COLORS;
  const accent = ACCENT_COLORS[settings.accentColor];
  const fonts = FONT_SCALES[settings.fontSize];

  return {
    // Backgrounds
    bg:         colors.bg,
    bgCard:     colors.bgCard,
    bgCardAlt:  colors.bgCardAlt,
    bgInput:    colors.bgInput,
    bgNav:      colors.bgNav,

    // Accent (changes with accentColor setting)
    honey:      accent.honey,
    honeyDark:  accent.honeyDark,
    honeyLight: accent.honeyLight,

    // Text
    textPrimary:   colors.textPrimary,
    textSecondary: colors.textSecondary,
    textMuted:     colors.textMuted,

    // Borders
    border:      colors.border,
    borderLight: colors.borderLight,

    // Static colors
    ...STATIC,

    // Font sizes (scale with fontSize setting)
    fontXL: fonts.XL,
    fontLG: fonts.LG,
    fontMD: fonts.MD,
    fontSM: fonts.SM,
    fontXS: fonts.XS,

    // Mode helpers
    isBeginner: settings.appMode === "beginner",
    isPro:      settings.appMode === "pro",
    isMinimal:  settings.appMode === "minimal",
  };
}