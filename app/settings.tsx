/**
 * app/settings.tsx
 *
 * Settings Screen — full app preferences.
 *
 * Controls:
 *  - App Mode: Beginner / Pro / Minimal
 *  - Color Scheme: Dark / Light / Auto
 *  - Accent Color: Honey / Forest / Ocean / Slate
 *  - Font Size: Small / Medium / Large / Extra Large
 */

import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import NavBar from "../components/NavBar";
import { useSettingsContext } from "../context/SettingsContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { AccentColor, AppMode, ColorScheme, FontSize } from "../utils/settingsStore";

export default function Settings() {
  const { settings, updateSettings } = useSettingsContext();
  const theme = useAppTheme();
  const S = makeStyles(theme);

  const OptionButton = ({
    label, selected, onPress, emoji,
  }: { label: string; selected: boolean; onPress: () => void; emoji?: string }) => (
    <Pressable onPress={onPress} style={[S.optionButton, selected && S.optionButtonSelected]}>
      {emoji && <Text style={S.optionEmoji}>{emoji}</Text>}
      <Text style={[S.optionText, selected && S.optionTextSelected]}>{label}</Text>
      {selected && <Text style={S.optionCheck}>✓</Text>}
    </Pressable>
  );

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>⚙️ Settings</Text>
        <Text style={S.subtitle}>Customize your Beehive Pro+ experience</Text>

        {/* ── App Mode ── */}
        <Text style={S.sectionLabel}>APP MODE</Text>
        <Text style={S.sectionHint}>Controls hints, guides, and information density</Text>
        <View style={S.optionRow}>
          <OptionButton emoji="🌱" label="Beginner" selected={settings.appMode === "beginner"} onPress={() => updateSettings({ appMode: "beginner" as AppMode })} />
          <OptionButton emoji="🐝" label="Pro" selected={settings.appMode === "pro"} onPress={() => updateSettings({ appMode: "pro" as AppMode })} />
          <OptionButton emoji="⚡" label="Minimal" selected={settings.appMode === "minimal"} onPress={() => updateSettings({ appMode: "minimal" as AppMode })} />
        </View>
        <View style={S.modeDescCard}>
          {settings.appMode === "beginner" && (
            <>
              <Text style={S.modeDescTitle}>🌱 Beginner Mode</Text>
              <Text style={S.modeDescText}>Extra hints and guides throughout the app. Comb Guide shows identification tips automatically. Best for new beekeepers learning the craft.</Text>
            </>
          )}
          {settings.appMode === "pro" && (
            <>
              <Text style={S.modeDescTitle}>🐝 Pro Mode</Text>
              <Text style={S.modeDescText}>Clean and efficient. All features available but no extra hints or explanations. Best for experienced beekeepers who know what they're doing.</Text>
            </>
          )}
          {settings.appMode === "minimal" && (
            <>
              <Text style={S.modeDescTitle}>⚡ Minimal Mode</Text>
              <Text style={S.modeDescText}>Maximum information density. Compact text, no decorative elements. Best for quick field checks when you need data fast.</Text>
            </>
          )}
        </View>

        {/* ── Color Scheme ── */}
        <Text style={S.sectionLabel}>COLOR SCHEME</Text>
        <Text style={S.sectionHint}>Auto follows your device's system setting</Text>
        <View style={S.optionRow}>
          <OptionButton emoji="🌙" label="Dark" selected={settings.colorScheme === "dark"} onPress={() => updateSettings({ colorScheme: "dark" as ColorScheme })} />
          <OptionButton emoji="☀️" label="Light" selected={settings.colorScheme === "light"} onPress={() => updateSettings({ colorScheme: "light" as ColorScheme })} />
          <OptionButton emoji="🌤" label="Auto" selected={settings.colorScheme === "auto"} onPress={() => updateSettings({ colorScheme: "auto" as ColorScheme })} />
        </View>

        {/* ── Accent Color ── */}
        <Text style={S.sectionLabel}>ACCENT COLOR</Text>
        <Text style={S.sectionHint}>The main color used for highlights and buttons</Text>
        <View style={S.colorRow}>
          {([
            { id: "honey", emoji: "🍯", label: "Honey", color: "#f59e0b" },
            { id: "forest", emoji: "🌿", label: "Forest", color: "#16a34a" },
            { id: "ocean", emoji: "🌊", label: "Ocean", color: "#0ea5e9" },
            { id: "slate", emoji: "🪨", label: "Slate", color: "#94a3b8" },
          ] as { id: AccentColor; emoji: string; label: string; color: string }[]).map((accent) => (
            <Pressable
              key={accent.id}
              onPress={() => updateSettings({ accentColor: accent.id })}
              style={[S.colorSwatch, { borderColor: accent.color }, settings.accentColor === accent.id && { backgroundColor: accent.color }]}
            >
              <Text style={S.colorSwatchEmoji}>{accent.emoji}</Text>
              <Text style={[S.colorSwatchLabel, settings.accentColor === accent.id && { color: theme.bg }]}>{accent.label}</Text>
              {settings.accentColor === accent.id && <Text style={[S.colorSwatchCheck, { color: theme.bg }]}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* ── Font Size ── */}
        <Text style={S.sectionLabel}>FONT SIZE</Text>
        <Text style={S.sectionHint}>Adjust text size for your comfort and lighting conditions</Text>
        <View style={S.optionRow}>
          <OptionButton label="Small" selected={settings.fontSize === "small"} onPress={() => updateSettings({ fontSize: "small" as FontSize })} />
          <OptionButton label="Medium" selected={settings.fontSize === "medium"} onPress={() => updateSettings({ fontSize: "medium" as FontSize })} />
          <OptionButton label="Large" selected={settings.fontSize === "large"} onPress={() => updateSettings({ fontSize: "large" as FontSize })} />
          <OptionButton label="XL" selected={settings.fontSize === "xlarge"} onPress={() => updateSettings({ fontSize: "xlarge" as FontSize })} />
        </View>
        <View style={S.fontPreviewCard}>
          <Text style={[S.fontPreviewTitle, { fontSize: theme.fontLG }]}>Preview text</Text>
          <Text style={[S.fontPreviewBody, { fontSize: theme.fontMD }]}>This is how your inspection notes will look at this font size.</Text>
          <Text style={[S.fontPreviewSmall, { fontSize: theme.fontSM }]}>This is how labels and hints will look.</Text>
        </View>

        {/* ── About ── */}
        <Text style={S.sectionLabel}>ABOUT</Text>
        <View style={S.infoCard}>
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>App</Text>
            <Text style={S.infoValue}>Beehive Pro+</Text>
          </View>
          <View style={S.infoDivider} />
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>Version</Text>
            <Text style={S.infoValue}>1.0.0</Text>
          </View>
          <View style={S.infoDivider} />
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>Developer</Text>
            <Text style={S.infoValue}>WebDebSpider's Designs</Text>
          </View>
          <View style={S.infoDivider} />
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>Built with</Text>
            <Text style={S.infoValue}>React Native + Firebase</Text>
          </View>
        </View>

        {/* ── Features ── */}
        <Text style={S.sectionLabel}>FEATURES</Text>
        <View style={S.infoCard}>
          {[
            "⚡ Quick tap inspections",
            "🎙️ Voice inspection logging",
            "🔬 AI comb photo analysis",
            "🔍 Interactive Comb Guide",
            "✏️ Photo annotation tools",
            "🧑‍🏫 Mentor sharing system",
            "🌿 Forage & environment mapping",
            "📊 Hive health charts",
            "☁️ Offline sync",
            "🔔 Inspection reminders",
            "🧰 Equipment & supplies tracker",
            "🏛️ Hive registration helper",
            "🏥 Health & disease log",
          ].map((item, i, arr) => (
            <Text key={item} style={[S.featureItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}>{item}</Text>
          ))}
        </View>

        {/* ── Coming Soon ── */}
        <Text style={S.sectionLabel}>COMING SOON</Text>
        <View style={S.infoCard}>
          {[
            "🎥 Video mentor chat",
            "🌱 AI plant identification",
            "📍 Hive location sharing",
          ].map((item, i, arr) => (
            <Text key={item} style={[S.featureItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}>{item}</Text>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceLG },
    sectionLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4, marginTop: theme.spaceLG },
    sectionHint: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: theme.spaceSM, fontStyle: "italic" },
    optionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    optionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: theme.bgCard, padding: 12, borderRadius: theme.radiusMD, borderWidth: 2, borderColor: theme.border, minWidth: 80 },
    optionButtonSelected: { borderColor: theme.honey, backgroundColor: theme.bgCardAlt },
    optionEmoji: { fontSize: 16 },
    optionText: { color: theme.textSecondary, fontWeight: "700", fontSize: theme.fontSM },
    optionTextSelected: { color: theme.honey },
    optionCheck: { color: theme.honey, fontWeight: "900", fontSize: theme.fontXS },
    modeDescCard: { backgroundColor: theme.bgCardAlt, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceSM, borderWidth: 1, borderColor: theme.border },
    modeDescTitle: { color: theme.honey, fontWeight: "900", fontSize: theme.fontSM, marginBottom: 6 },
    modeDescText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20 },
    colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    colorSwatch: { flex: 1, alignItems: "center", padding: 12, borderRadius: theme.radiusMD, borderWidth: 2, backgroundColor: theme.bgCard, minWidth: 70, gap: 4 },
    colorSwatchEmoji: { fontSize: 20 },
    colorSwatchLabel: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    colorSwatchCheck: { fontSize: theme.fontXS, fontWeight: "900" },
    fontPreviewCard: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceSM, borderWidth: 1, borderColor: theme.border, gap: 8 },
    fontPreviewTitle: { color: theme.textPrimary, fontWeight: "900" },
    fontPreviewBody: { color: theme.textSecondary, lineHeight: 24 },
    fontPreviewSmall: { color: theme.textMuted },
    infoCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: theme.spaceMD, gap: 12 },
    infoLabel: { color: theme.textMuted, fontSize: theme.fontSM, flex: 1 },
    infoValue: { color: theme.textPrimary, fontWeight: "700", fontSize: theme.fontSM, flex: 2, textAlign: "right" },
    infoDivider: { height: 1, backgroundColor: theme.border },
    featureItem: { color: theme.textSecondary, fontSize: theme.fontSM, padding: theme.spaceMD, borderBottomWidth: 1, borderBottomColor: theme.border },
  });
}
