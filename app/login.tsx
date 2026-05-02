/**
 * app/login.tsx
 *
 * Login Screen — handles login and account creation.
 * Uses AsyncStorage-based auth (utils/auth.ts).
 * TODO: Replace with Firebase Auth before public release.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { login, register } from "../utils/auth";
import { T } from "../utils/theme";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await login(email, password);
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await register(email, password);
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Registration failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🐝</Text>
          <Text style={styles.title}>Beehive Pro</Text>
          <Text style={styles.subtitle}>Sign in to manage your apiary</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>📧 Email</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={T.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Text style={styles.label}>🔒 Password</Text>
          <TextInput
            placeholder="Your password"
            placeholderTextColor={T.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Pressable onPress={handleLogin} disabled={loading} style={[styles.loginButton, loading && styles.disabledButton]}>
            <Text style={styles.loginText}>{loading ? "Signing in..." : "Sign In"}</Text>
          </Pressable>
          <Pressable onPress={handleRegister} disabled={loading} style={[styles.registerButton, loading && styles.disabledButton]}>
            <Text style={styles.registerText}>{loading ? "Creating..." : "Create Account"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { flex: 1, padding: T.spaceMD, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: T.spaceXL },
  logo: { fontSize: 64, marginBottom: T.spaceSM },
  title: { color: T.textPrimary, fontSize: T.fontXL, fontWeight: "900", letterSpacing: 0.5 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginTop: 6 },
  form: { gap: 4 },
  label: { color: T.textSecondary, fontSize: T.fontSM, fontWeight: "700", marginTop: T.spaceMD, marginBottom: 8 },
  input: { backgroundColor: T.bgInput, color: T.textPrimary, padding: 14, borderRadius: T.radiusMD, fontSize: T.fontMD, borderWidth: 1, borderColor: T.border },
  loginButton: { backgroundColor: T.honey, padding: 16, borderRadius: T.radiusMD, alignItems: "center", marginTop: T.spaceLG },
  loginText: { color: T.bg, fontWeight: "900", fontSize: T.fontMD },
  registerButton: { backgroundColor: T.bgCardAlt, padding: 16, borderRadius: T.radiusMD, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: T.border },
  registerText: { color: T.textPrimary, fontWeight: "900", fontSize: T.fontMD },
  disabledButton: { backgroundColor: T.textMuted },
});