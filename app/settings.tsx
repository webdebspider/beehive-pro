/**
 * app/settings.tsx
 *
 * Settings Screen — full app preferences.
 *
 * Controls:
 *  - Account: Change Password + Sign Out  (NEW 2026-05-13)
 *  - App Mode: Beginner / Pro / Minimal
 *  - Color Scheme: Dark / Light / Auto
 *  - Accent Color: Honey / Forest / Ocean / Slate
 *  - Font Size: Small / Medium / Large / Extra Large
 *
 * ───────────────────────────────────────────────────────────────────────
 * CHANGE HISTORY
 * ───────────────────────────────────────────────────────────────────────
 * 2026-05-13  Added Account section at the top of the screen with:
 *               - "Signed in as: <email>" identity line
 *               - "Change Password" expandable form (email/password users)
 *                 OR "Managed by Google" notice (Google sign-in users)
 *               - Sign Out button with confirmation alert
 *
 *             Motivation: beta testers (e.g. Nadine) receiving a temp
 *             password via FB Messenger need to set their own password
 *             from inside the app, without the spam-folder dance of an
 *             email reset. Also fills the previously missing Sign Out
 *             affordance.
 *
 *             No existing sections, styles, or behavior were modified.
 *             SafeAreaView migration to react-native-safe-area-context
 *             is still pending across older screens — NOT touched here
 *             to keep this change focused.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import NavBar from "../components/NavBar";
import { useSettingsContext } from "../context/SettingsContext";
import { useAppTheme } from "../hooks/useAppTheme";
import {
  changePassword,
  getCurrentUserEmail,
  isGoogleProvider,
  logout,
} from "../utils/auth";
import { AccentColor, AppMode, ColorScheme, FontSize } from "../utils/settingsStore";


/**
 * Map Firebase auth error codes to user-friendly messages for the
 * Change Password flow. Same pattern as login.tsx::getFriendlyError(),
 * scoped to the codes you can realistically hit during a password
 * change so we don't accidentally claim an irrelevant cause.
 */
function getPasswordErrorMessage(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect. Please try again.";
    case "auth/weak-password":
      return "New password must be at least 6 characters.";
    case "auth/requires-recent-login":
      return "For security, please sign out and back in, then try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/no-current-user":
      return "You're not signed in. Please sign in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}


export default function Settings() {
  const router = useRouter();
  const { settings, updateSettings } = useSettingsContext();
  const theme = useAppTheme();
  const S = makeStyles(theme);

  // ════════════════════════════════════════════════════════════════════
  // ACCOUNT SECTION STATE (NEW 2026-05-13)
  // ════════════════════════════════════════════════════════════════════
  // Identity pulled once on mount. These don't change during the session
  // unless the user signs out (in which case we navigate away anyway).
  const userEmail = getCurrentUserEmail();
  const isGoogleUser = isGoogleProvider();

  // Change Password form state — visibility toggle, inputs, busy flag.
  const [pwExpanded, setPwExpanded] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  /**
   * Validate the form locally, then call the Firebase change-password
   * helper. Local validation catches obvious issues (mismatched confirm,
   * empty fields, too-short new password, same-as-current) before we
   * hit Firebase — saves a round-trip and gives cleaner error UX.
   */
  const handleChangePassword = async () => {
    if (pwBusy) return;

    // Local checks first — fast fail before network call.
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert("Missing info", "Please fill in all three password fields.");
      return;
    }
    if (newPw.length < 6) {
      Alert.alert("Weak password", "New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("Passwords don't match", "The new password and confirmation don't match.");
      return;
    }
    if (newPw === currentPw) {
      Alert.alert(
        "Same password",
        "Please choose a new password that's different from your current one."
      );
      return;
    }

    // All clear — call Firebase. changePassword() will re-authenticate
    // first (verifies currentPw), then update to newPw.
    try {
      setPwBusy(true);
      await changePassword(currentPw, newPw);
      // Success: clear inputs, collapse form, tell the user.
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwExpanded(false);
      Alert.alert("Password updated", "Your password has been changed successfully.");
    } catch (e: any) {
      Alert.alert("Couldn't update password", getPasswordErrorMessage(e));
    } finally {
      setPwBusy(false);
    }
  };

  /**
   * Confirm before signing out so an accidental tap doesn't yank the
   * user out of their session mid-task. On confirm, sign out and
   * navigate to the login screen. router.replace prevents back-button
   * bypass (user can't go "back" into authed screens after signing out).
   */
  const handleSignOut = () => {
    Alert.alert(
      "Sign out?",
      "You'll need to sign in again to access your hives.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/login");
            } catch {
              Alert.alert("Sign out failed", "Please try again.");
            }
          },
        },
      ]
    );
  };

  // Existing helper — unchanged.
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

        {/* ══════════════════════════════════════════════════════════════
            ACCOUNT (NEW 2026-05-13)

            Identity, password change, sign out. Placed first because
            the critical onboarding action (setting your own password
            after a temp credential) needs to be discoverable for beta
            testers like Nadine.
            ══════════════════════════════════════════════════════════ */}
        <Text style={S.sectionLabel}>ACCOUNT</Text>
        <View style={S.infoCard}>
          {/* "Signed in as" identity row — shows current email so the
              user can confirm at a glance which account they're managing. */}
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>Signed in as</Text>
            <Text style={S.infoValue} numberOfLines={1}>
              {userEmail ?? "(not signed in)"}
            </Text>
          </View>
          <View style={S.infoDivider} />

          {/* Branch: Google users see a notice (no password to change);
              email/password users get the expandable Change Password form. */}
          {isGoogleUser ? (
            <View style={S.googleNoticeRow}>
              <Text style={S.googleNoticeText}>
                🔐 Your account is managed by Google. To change your password,
                use your Google account settings.
              </Text>
            </View>
          ) : (
            <>
              {/* Toggle row — tap to expand/collapse the form. */}
              <Pressable
                style={S.accountActionRow}
                onPress={() => setPwExpanded((prev) => !prev)}
              >
                <Text style={S.accountActionLabel}>🔑 Change Password</Text>
                <Text style={S.accountActionArrow}>{pwExpanded ? "▾" : "▸"}</Text>
              </Pressable>

              {pwExpanded && (
                <View style={S.pwFormCard}>
                  <Text style={S.pwLabel}>Current password</Text>
                  <TextInput
                    style={S.pwInput}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                    value={currentPw}
                    onChangeText={setCurrentPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={S.pwLabel}>New password</Text>
                  <TextInput
                    style={S.pwInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                    value={newPw}
                    onChangeText={setNewPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={S.pwLabel}>Confirm new password</Text>
                  <TextInput
                    style={S.pwInput}
                    placeholder="Re-enter new password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                    value={confirmPw}
                    onChangeText={setConfirmPw}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={[S.pwSubmitButton, pwBusy && S.pwSubmitButtonBusy]}
                    onPress={handleChangePassword}
                    disabled={pwBusy}
                  >
                    <Text style={S.pwSubmitText}>
                      {pwBusy ? "Updating..." : "Update Password"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <View style={S.infoDivider} />

          {/* Sign Out — destructive action, styled in red so it stands
              out from neutral rows and isn't mistaken for navigation. */}
          <Pressable style={S.accountActionRow} onPress={handleSignOut}>
            <Text style={S.signOutLabel}>🚪 Sign Out</Text>
            <Text style={S.accountActionArrow}>→</Text>
          </Pressable>
        </View>

        {/* ── App Mode ── (unchanged) */}
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

        {/* ── Color Scheme ── (unchanged) */}
        <Text style={S.sectionLabel}>COLOR SCHEME</Text>
        <Text style={S.sectionHint}>Auto follows your device's system setting</Text>
        <View style={S.optionRow}>
          <OptionButton emoji="🌙" label="Dark" selected={settings.colorScheme === "dark"} onPress={() => updateSettings({ colorScheme: "dark" as ColorScheme })} />
          <OptionButton emoji="☀️" label="Light" selected={settings.colorScheme === "light"} onPress={() => updateSettings({ colorScheme: "light" as ColorScheme })} />
          <OptionButton emoji="🌤" label="Auto" selected={settings.colorScheme === "auto"} onPress={() => updateSettings({ colorScheme: "auto" as ColorScheme })} />
        </View>

        {/* ── Accent Color ── (unchanged) */}
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

        {/* ── Font Size ── (unchanged) */}
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

        {/* ── About ── (unchanged) */}
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

        {/* ── Features ── (unchanged) */}
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

        {/* ── Coming Soon ── (unchanged) */}
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

        {/* ── Links ── (unchanged) */}
        <Text style={S.sectionLabel}>LINKS</Text>
        <View style={S.infoCard}>
          <Pressable style={S.linkRow} onPress={() => Linking.openURL("https://webdebspider.github.io/beehive-pro/")}>
            <Text style={S.linkLabel}>🌐 Website</Text>
            <Text style={S.linkArrow}>→</Text>
          </Pressable>
          <View style={S.infoDivider} />
          <Pressable style={S.linkRow} onPress={() => Linking.openURL("https://webdebspider.github.io/beehive-pro/privacy-policy.html")}>
            <Text style={S.linkLabel}>🔒 Privacy Policy</Text>
            <Text style={S.linkArrow}>→</Text>
          </Pressable>
          <View style={S.infoDivider} />
          <Pressable style={S.linkRow} onPress={() => Linking.openURL("mailto:webdebspiderdesigns@gmail.com")}>
            <Text style={S.linkLabel}>✉️ Contact Support</Text>
            <Text style={S.linkArrow}>→</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    // ── Page chrome / shared (unchanged) ────────────────────────────────
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, paddingBottom: 50 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceLG },
    sectionLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4, marginTop: theme.spaceLG },
    sectionHint: { color: theme.textMuted, fontSize: theme.fontXS, marginBottom: theme.spaceSM, fontStyle: "italic" },

    // ── Option button rows (unchanged) ──────────────────────────────────
    optionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    optionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: theme.bgCard, padding: 12, borderRadius: theme.radiusMD, borderWidth: 2, borderColor: theme.border, minWidth: 80 },
    optionButtonSelected: { borderColor: theme.honey, backgroundColor: theme.bgCardAlt },
    optionEmoji: { fontSize: 16 },
    optionText: { color: theme.textSecondary, fontWeight: "700", fontSize: theme.fontSM },
    optionTextSelected: { color: theme.honey },
    optionCheck: { color: theme.honey, fontWeight: "900", fontSize: theme.fontXS },

    // ── Mode description card (unchanged) ───────────────────────────────
    modeDescCard: { backgroundColor: theme.bgCardAlt, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceSM, borderWidth: 1, borderColor: theme.border },
    modeDescTitle: { color: theme.honey, fontWeight: "900", fontSize: theme.fontSM, marginBottom: 6 },
    modeDescText: { color: theme.textSecondary, fontSize: theme.fontSM, lineHeight: 20 },

    // ── Accent color swatches (unchanged) ───────────────────────────────
    colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    colorSwatch: { flex: 1, alignItems: "center", padding: 12, borderRadius: theme.radiusMD, borderWidth: 2, backgroundColor: theme.bgCard, minWidth: 70, gap: 4 },
    colorSwatchEmoji: { fontSize: 20 },
    colorSwatchLabel: { color: theme.textSecondary, fontSize: theme.fontXS, fontWeight: "700" },
    colorSwatchCheck: { fontSize: theme.fontXS, fontWeight: "900" },

    // ── Font preview card (unchanged) ───────────────────────────────────
    fontPreviewCard: { backgroundColor: theme.bgCard, padding: theme.spaceMD, borderRadius: theme.radiusMD, marginTop: theme.spaceSM, borderWidth: 1, borderColor: theme.border, gap: 8 },
    fontPreviewTitle: { color: theme.textPrimary, fontWeight: "900" },
    fontPreviewBody: { color: theme.textSecondary, lineHeight: 24 },
    fontPreviewSmall: { color: theme.textMuted },

    // ── Info card / rows (unchanged — also reused by new Account card) ──
    infoCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusMD, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: theme.spaceMD, gap: 12 },
    infoLabel: { color: theme.textMuted, fontSize: theme.fontSM, flex: 1 },
    infoValue: { color: theme.textPrimary, fontWeight: "700", fontSize: theme.fontSM, flex: 2, textAlign: "right" },
    infoDivider: { height: 1, backgroundColor: theme.border },

    // ── Feature/coming-soon list items (unchanged) ──────────────────────
    featureItem: { color: theme.textSecondary, fontSize: theme.fontSM, padding: theme.spaceMD, borderBottomWidth: 1, borderBottomColor: theme.border },

    // ── Link rows (unchanged) ───────────────────────────────────────────
    linkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: theme.spaceMD },
    linkLabel: { color: theme.honey, fontWeight: "800", fontSize: theme.fontSM },
    linkArrow: { color: theme.textMuted, fontSize: theme.fontMD },

    // ══════════════════════════════════════════════════════════════════
    // NEW (2026-05-13) — Account section styles
    // ══════════════════════════════════════════════════════════════════
    // Row used for the "Change Password" toggle and the "Sign Out" tap
    // target. Matches the visual rhythm of linkRow but separated so we
    // can style each side's label independently.
    accountActionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spaceMD,
    },
    accountActionLabel: {
      color: theme.honey,
      fontWeight: "800",
      fontSize: theme.fontSM,
    },
    accountActionArrow: {
      color: theme.textMuted,
      fontSize: theme.fontMD,
    },
    // Sign-out is a destructive action — red label so it visually
    // distinguishes from regular navigation rows. Same row layout
    // otherwise.
    signOutLabel: {
      color: "#dc2626", // red-600 — destructive action color
      fontWeight: "800",
      fontSize: theme.fontSM,
    },
    // Notice shown to Google-signed-in users (in lieu of password form).
    googleNoticeRow: {
      padding: theme.spaceMD,
    },
    googleNoticeText: {
      color: theme.textSecondary,
      fontSize: theme.fontSM,
      lineHeight: 20,
      fontStyle: "italic",
    },
    // Expandable Change Password form — slightly tinted background so
    // it visually nests inside the Account card.
    pwFormCard: {
      backgroundColor: theme.bgCardAlt,
      padding: theme.spaceMD,
      gap: 4,
    },
    pwLabel: {
      color: theme.textSecondary,
      fontSize: theme.fontSM,
      fontWeight: "700",
      marginTop: theme.spaceSM,
      marginBottom: 6,
    },
    pwInput: {
      backgroundColor: theme.bgInput,
      color: theme.textPrimary,
      padding: 12,
      borderRadius: theme.radiusMD,
      fontSize: theme.fontMD,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pwSubmitButton: {
      backgroundColor: theme.honey,
      padding: 14,
      borderRadius: theme.radiusMD,
      alignItems: "center",
      marginTop: theme.spaceMD,
    },
    pwSubmitButtonBusy: {
      opacity: 0.6,
    },
    pwSubmitText: {
      color: theme.bg,
      fontWeight: "900",
      fontSize: theme.fontMD,
    },
  });
}
