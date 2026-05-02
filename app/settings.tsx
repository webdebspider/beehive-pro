/**
 * app/settings.tsx
 *
 * Settings Screen — app preferences and info.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import NavBar from "../components/NavBar";
import { T } from "../utils/theme";

export default function Settings() {
  const [dark, setDark] = useState(false);

  useEffect(() => { AsyncStorage.getItem("dark").then((v) => setDark(v === "true")); }, []);

  const save = async () => {
    await AsyncStorage.setItem("dark", dark.toString());
    Alert.alert("Saved", "Your preferences have been saved.");
  };

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>App preferences</Text>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>🌙 Dark Mode</Text>
            <Text style={styles.settingHint}>Use dark theme throughout the app</Text>
          </View>
          <Switch value={dark} onValueChange={setDark} trackColor={{ false: T.border, true: T.honey }} thumbColor={dark ? T.honeyLight : T.textMuted} />
        </View>
        <Pressable onPress={save} style={styles.saveButton}>
          <Text style={styles.saveText}>Save Preferences</Text>
        </Pressable>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>App</Text><Text style={styles.infoValue}>Beehive Pro</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Version</Text><Text style={styles.infoValue}>1.0.0 (dev)</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Built with</Text><Text style={styles.infoValue}>React Native + Firebase</Text></View>
        </View>
        <Text style={styles.sectionLabel}>COMING SOON</Text>
        <View style={styles.infoCard}>
          {["🗺️ Forage & environment mapping", "📸 Photo annotation tools", "🧑‍🏫 Mentor sharing system", "🔔 Inspection reminders", "🎙️ Voice notes"].map((item) => (
            <Text key={item} style={styles.comingSoonItem}>{item}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.spaceMD, paddingBottom: 50 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceLG },
  sectionLabel: { color: T.textMuted, fontSize: T.fontXS, fontWeight: "800", letterSpacing: 1.5, marginBottom: T.spaceSM, marginTop: T.spaceLG },
  settingRow: { flexDirection: "row", alignItems: "center", backgroundColor: T.bgCard, padding: T.spaceMD, borderRadius: T.radiusMD, borderWidth: 1, borderColor: T.border, marginBottom: T.spaceSM },
  settingInfo: { flex: 1 },
  settingLabel: { color: T.textPrimary, fontWeight: "800", fontSize: T.fontMD },
  settingHint: { color: T.textMuted, fontSize: T.fontXS, marginTop: 2 },
  saveButton: { backgroundColor: T.green, padding: 14, borderRadius: T.radiusMD, alignItems: "center", marginTop: T.spaceSM },
  saveText: { color: "#fff", fontWeight: "900", fontSize: T.fontSM },
  infoCard: { backgroundColor: T.bgCard, borderRadius: T.radiusMD, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", padding: T.spaceMD },
  infoLabel: { color: T.textMuted, fontSize: T.fontSM },
  infoValue: { color: T.textPrimary, fontWeight: "700", fontSize: T.fontSM },
  infoDivider: { height: 1, backgroundColor: T.border },
  comingSoonItem: { color: T.textSecondary, fontSize: T.fontSM, padding: T.spaceMD, borderBottomWidth: 1, borderBottomColor: T.border },
});