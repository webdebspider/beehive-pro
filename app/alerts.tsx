/**
 * app/alerts.tsx
 *
 * Alerts Screen — shows hive health alerts generated from inspection scores.
 * Critical alerts (score < 70) shown in red, warnings (score < 85) in amber.
 * Loads from AsyncStorage via utils/storage.ts
 */

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import NavBar from "../components/NavBar";
import { getAlerts } from "../utils/storage";
import { T } from "../utils/theme";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAlerts().then(setAlerts);
    }, [])
  );

  return (
    <SafeAreaView style={styles.page}>
      <NavBar />
      <View style={styles.content}>
        <Text style={styles.title}>🚨 Alerts</Text>
        <Text style={styles.subtitle}>
          {alerts.length === 0
            ? "All hives looking good"
            : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} need attention`}
        </Text>

        {alerts.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>No alerts right now</Text>
            <Text style={styles.emptyHint}>Your hives are all in good shape!</Text>
          </View>
        )}

        <FlatList
          data={alerts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={[styles.alertCard, item.type === "critical" ? styles.alertCritical : styles.alertWarning]}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{item.type === "critical" ? "🔴" : "⚠️"}</Text>
                <View>
                  <Text style={styles.alertHive}>Hive {item.hiveId}</Text>
                  <Text style={styles.alertType}>{item.type === "critical" ? "Critical" : "Warning"}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: item.type === "critical" ? T.danger : T.warning }]}>
                  <Text style={styles.scoreText}>{item.score}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.spaceMD, flex: 1 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginBottom: T.spaceLG },
  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: T.textPrimary, fontSize: T.fontMD, fontWeight: "800" },
  emptyHint: { color: T.textMuted, fontSize: T.fontSM, marginTop: 6 },
  alertCard: { padding: T.spaceMD, borderRadius: T.radiusMD, marginBottom: 10, borderWidth: 1 },
  alertCritical: { backgroundColor: T.dangerBg, borderColor: T.danger },
  alertWarning: { backgroundColor: T.warningBg, borderColor: T.warning },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertIcon: { fontSize: 24 },
  alertHive: { color: T.textPrimary, fontWeight: "900", fontSize: T.fontMD },
  alertType: { color: T.textSecondary, fontSize: T.fontXS, marginTop: 2 },
  scoreBadge: { marginLeft: "auto", width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  scoreText: { color: "#fff", fontWeight: "900", fontSize: T.fontSM },
});