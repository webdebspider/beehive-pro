/**
 * app/login.tsx
 *
 * Login Screen — Firebase email/password and Google sign-in.
 *
 * Features:
 *  - Email/password login and registration
 *  - Google one-tap sign-in via expo-auth-session
 *  - Password reset via email
 *  - Show/hide password toggle
 *  - Friendly error messages
 *  - Redirects to /hive on successful auth
 */

import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppTheme } from "../hooks/useAppTheme";
import {
  loginWithEmail,
  loginWithGoogleCredential,
  registerWithEmail,
  resetPassword,
} from "../utils/auth";

const GOOGLE_CLIENT_ID = "950068293878-6i3gj20ov1osm2knc7lh8kt3road0gu7.apps.googleusercontent.com";

/** Translates Firebase auth error codes to friendly messages */
function getFriendlyError(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/user-not-found":
      return "No account found with that email. Try creating one!";
    case "auth/wrong-password":
      return "Incorrect password. Try again or reset your password.";
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in!";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function Login() {
  const router = useRouter();
  const theme = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleCredential(id_token);
    }
  }, [response]);

  const handleGoogleCredential = async (idToken: string) => {
    try {
      setLoading(true);
      await loginWithGoogleCredential(idToken);
      router.replace("/hive");
    } catch (e: any) {
      Alert.alert("Google sign-in failed", getFriendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      await loginWithEmail(email.trim(), password);
      router.replace("/hive");
    } catch (e: any) {
      Alert.alert("Login failed", getFriendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    try {
      setLoading(true);
      await registerWithEmail(email.trim(), password);
      router.replace("/hive");
    } catch (e: any) {
      Alert.alert("Registration failed", getFriendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Enter your email", "Please enter your email address to reset your password.");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email.trim());
      Alert.alert("Email sent! 📧", "Check your inbox for a password reset link.");
      setMode("login");
    } catch (e: any) {
      Alert.alert("Reset failed", getFriendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={S.content}>

          {/* Logo */}
          <View style={S.header}>
            <Text style={S.logo}>🐝</Text>
            <Text style={S.title}>Beehive Pro</Text>
            <Text style={S.subtitle}>
              {mode === "login" && "Sign in to manage your apiary"}
              {mode === "register" && "Create your account"}
              {mode === "reset" && "Reset your password"}
            </Text>
          </View>

          {/* Form */}
          <View style={S.form}>

            {/* Email */}
            <Text style={S.label}>📧 Email</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={S.input}
              returnKeyType="next"
            />

            {/* Password with show/hide toggle */}
            {mode !== "reset" && (
              <>
                <Text style={S.label}>🔒 Password</Text>
                <View style={S.passwordRow}>
                  <TextInput
                    placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={S.passwordInput}
                    returnKeyType="done"
                    onSubmitEditing={mode === "login" ? handleLogin : handleRegister}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={S.eyeButton}
                  >
                    <Text style={S.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Primary action */}
            {mode === "login" && (
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={[S.primaryButton, loading && S.disabledButton]}
              >
                <Text style={S.primaryButtonText}>
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </Pressable>
            )}

            {mode === "register" && (
              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={[S.primaryButton, loading && S.disabledButton]}
              >
                <Text style={S.primaryButtonText}>
                  {loading ? "Creating account..." : "Create Account"}
                </Text>
              </Pressable>
            )}

            {mode === "reset" && (
              <Pressable
                onPress={handleReset}
                disabled={loading}
                style={[S.primaryButton, loading && S.disabledButton]}
              >
                <Text style={S.primaryButtonText}>
                  {loading ? "Sending..." : "Send Reset Email"}
                </Text>
              </Pressable>
            )}

            {/* Google sign-in */}
            {mode !== "reset" && (
              <>
                <View style={S.dividerRow}>
                  <View style={S.dividerLine} />
                  <Text style={S.dividerText}>or</Text>
                  <View style={S.dividerLine} />
                </View>

                <Pressable
                  onPress={() => promptAsync()}
                  disabled={!request || loading}
                  style={[S.googleButton, (!request || loading) && S.disabledButton]}
                >
                  <Text style={S.googleButtonText}>🔵 Continue with Google</Text>
                </Pressable>
              </>
            )}

            {/* Mode switchers */}
            <View style={S.switchRow}>
              {mode === "login" && (
                <>
                  <Pressable onPress={() => setMode("register")}>
                    <Text style={S.switchText}>No account? Create one</Text>
                  </Pressable>
                  <Pressable onPress={() => setMode("reset")}>
                    <Text style={S.switchText}>Forgot password?</Text>
                  </Pressable>
                </>
              )}
              {mode === "register" && (
                <Pressable onPress={() => setMode("login")}>
                  <Text style={S.switchText}>Already have an account? Sign in</Text>
                </Pressable>
              )}
              {mode === "reset" && (
                <Pressable onPress={() => setMode("login")}>
                  <Text style={S.switchText}>← Back to sign in</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, padding: theme.spaceMD, justifyContent: "center" },
    header: { alignItems: "center", marginBottom: theme.spaceXL },
    logo: { fontSize: 72, marginBottom: theme.spaceSM },
    title: { color: theme.textPrimary, fontSize: theme.fontXL, fontWeight: "900", letterSpacing: 0.5 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6, textAlign: "center" },
    form: { gap: 4 },
    label: { color: theme.textSecondary, fontSize: theme.fontSM, fontWeight: "700", marginTop: theme.spaceMD, marginBottom: 8 },
    input: {
      backgroundColor: theme.bgInput,
      color: theme.textPrimary,
      padding: 14,
      borderRadius: theme.radiusMD,
      fontSize: theme.fontMD,
      borderWidth: 1,
      borderColor: theme.border,
    },

    // Password row with show/hide toggle
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.bgInput,
      borderRadius: theme.radiusMD,
      borderWidth: 1,
      borderColor: theme.border,
    },
    passwordInput: {
      flex: 1,
      color: theme.textPrimary,
      padding: 14,
      fontSize: theme.fontMD,
    },
    eyeButton: {
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    eyeText: { fontSize: 18 },

    primaryButton: {
      backgroundColor: theme.honey,
      padding: 16,
      borderRadius: theme.radiusMD,
      alignItems: "center",
      marginTop: theme.spaceLG,
    },
    primaryButtonText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: theme.spaceMD,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dividerText: { color: theme.textMuted, fontSize: theme.fontXS },
    googleButton: {
      backgroundColor: theme.bgCardAlt,
      padding: 16,
      borderRadius: theme.radiusMD,
      alignItems: "center",
      marginTop: theme.spaceSM,
      borderWidth: 1,
      borderColor: theme.border,
    },
    googleButtonText: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD },
    disabledButton: { backgroundColor: theme.textMuted },
    switchRow: {
      marginTop: theme.spaceLG,
      gap: 12,
      alignItems: "center",
    },
    switchText: {
      color: theme.honey,
      fontSize: theme.fontSM,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
}