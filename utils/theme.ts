/**
 * theme.ts
 *
 * Central design system for Beehive Pro.
 *
 * Design goals:
 *  - Outdoor readable: high contrast for sunlight and shade use
 *  - Warm & organic: honey ambers, earth browns, forest greens
 *  - Professional: consistent spacing and typography
 *
 * Usage: import { T } from "../utils/theme" on any screen
 * Changing a value here updates every screen that uses it.
 */

export const T = {
  // ── Backgrounds ──────────────────────────────────────
  bg:         '#12100e',   // Main screen background (warm near-black)
  bgCard:     '#1e1a14',   // Card/panel background
  bgCardAlt:  '#2a2318',   // Slightly lighter card (alternate rows)
  bgInput:    '#251f17',   // Text input background
  bgNav:      '#1a1510',   // Nav bar background

  // ── Honey / Amber accents ─────────────────────────────
  honey:      '#f59e0b',   // Primary brand color — honey amber
  honeyDark:  '#b45309',   // Darker amber for pressed states
  honeyLight: '#fcd34d',   // Light amber for highlights/badges

  // ── Action colors ─────────────────────────────────────
  green:      '#16a34a',   // Primary action (save, confirm)
  greenLight: '#22c55e',   // Lighter green for labels/accents

  // ── Text ──────────────────────────────────────────────
  textPrimary:   '#fef3c7', // Warm white — main text, high contrast
  textSecondary: '#d4b896', // Warm tan — labels, subtitles
  textMuted:     '#8a7560', // Muted earthy — hints, placeholders

  // ── Status ────────────────────────────────────────────
  danger:    '#dc2626',    // Destructive actions (delete)
  dangerBg:  '#450a0a',    // Danger background
  warning:   '#d97706',    // Warning state
  warningBg: '#451a03',    // Warning background

  // ── Borders ───────────────────────────────────────────
  border:      '#3d3020',  // Standard border
  borderLight: '#4a3a28',  // Lighter border

  // ── Typography ────────────────────────────────────────
  fontXL:   32,
  fontLG:   24,
  fontMD:   17,
  fontSM:   14,
  fontXS:   12,

  // ── Spacing ───────────────────────────────────────────
  spaceSM:  8,
  spaceMD:  16,
  spaceLG:  24,
  spaceXL:  32,

  // ── Radius ────────────────────────────────────────────
  radiusSM: 8,
  radiusMD: 12,
  radiusLG: 16,
};