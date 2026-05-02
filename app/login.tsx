/**
 * app/login.tsx
 *
 * Login Screen — handles login and account creation.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppTheme } from "../hooks/useAppTheme";
import { login, register } from "../utils/auth";

export default function Login() {
  const router = useRouter();
  const theme = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    try { setLoading(true); await login(email, password); router.replace("/"); }
    catch (e: any) { Alert.alert("Login failed", e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (loading) return;
    try { setLoading(true); await register(email, password); router.replace("/"); }
    catch (e: any) { Alert.alert("Registration failed", e.message); }
    finally { setLoading(false); }
  };

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <View style={S.content}>
        <View style={S.header}>
          <Text style={S.logo}>🐝</Text>
          <Text style={S.title}>Beehive Pro</Text>
          <Text style={S.subtitle}>Sign in to manage your apiary</Text>
        </View>
        <View style={S.form}>
          <Text style={S.label}>📧 Email</Text>
          <TextInput placeholder="you@example.com" placeholderTextColor={theme.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={S.input} />
          <Text style={S.label}>🔒 Password</Text>
          <TextInput placeholder="Your password" placeholderTextColor={theme.textMuted} secureTextEntry value={password} onChangeText={setPassword} style={S.input} />
          <Pressable onPress={handleLogin} disabled={loading} style={[S.loginButton, loading && S.disabledButton]}>
            <Text style={S.loginText}>{loading ? "Signing in..." : "Sign In"}</Text>
          </Pressable>
          <Pressable onPress={handleRegister} disabled={loading} style={[S.registerButton, loading && S.disabledButton]}>
            <Text style={S.registerText}>{loading ? "Creating..." : "Create Account"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { flex: 1, padding: theme.spaceMD, justifyContent: "center" },
    header: { alignItems: "center", marginBottom: theme.spaceXL },
    logo: { fontSize: 64, marginBottom: theme.spaceSM },
    title: { color: theme.textPrimary, fontSize: theme.fontXL, fontWeight: "900", letterSpacing: 0.5 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6 },
    form: { gap: 4 },
    label: { color: theme.textSecondary, fontSize: theme.fontSM, fontWeight: "700", marginTop: theme.spaceMD, marginBottom: 8 },
    input: { backgroundColor: theme.bgInput, color: theme.textPrimary, padding: 14, borderRadius: theme.radiusMD, fontSize: theme.fontMD, borderWidth: 1, borderColor: theme.border },
    loginButton: { backgroundColor: theme.honey, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceLG },
    loginText: { color: theme.bg, fontWeight: "900", fontSize: theme.fontMD },
    registerButton: { backgroundColor: theme.bgCardAlt, padding: 16, borderRadius: theme.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: theme.border },
    registerText: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD },
    disabledButton: { backgroundColor: theme.textMuted },
  });
}