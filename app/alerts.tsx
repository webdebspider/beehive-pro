/**
 * app/alerts.tsx
 *
 * Alerts Screen — shows hive health alerts.
 */

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import NavBar from "../components/NavBar";
import { useAppTheme } from "../hooks/useAppTheme";
import { getAlerts } from "../utils/storage";

export default function Alerts() {
  const theme = useAppTheme();
  const [alerts, setAlerts] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { getAlerts().then(setAlerts); }, []));

  const S = makeStyles(theme);

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <View style={S.content}>
        <Text style={S.title}>🚨 Alerts</Text>
        <Text style={S.subtitle}>{alerts.length === 0 ? "All hives looking good" : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} need attention`}</Text>
        {alerts.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>✅</Text>
            <Text style={S.emptyText}>No alerts right now</Text>
            <Text style={S.emptyHint}>Your hives are all in good shape!</Text>
          </View>
        )}
        <FlatList
          data={alerts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={[S.alertCard, item.type === "critical" ? S.alertCritical : S.alertWarning]}>
              <View style={S.alertHeader}>
                <Text style={S.alertIcon}>{item.type === "critical" ? "🔴" : "⚠️"}</Text>
                <View>
                  <Text style={S.alertHive}>Hive {item.hiveId}</Text>
                  <Text style={S.alertType}>{item.type === "critical" ? "Critical" : "Warning"}</Text>
                </View>
                <View style={[S.scoreBadge, { backgroundColor: item.type === "critical" ? theme.danger : theme.warning }]}>
                  <Text style={S.scoreText}>{item.score}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.bg },
    content: { padding: theme.spaceMD, flex: 1 },
    title: { color: theme.textPrimary, fontSize: theme.fontLG, fontWeight: "900", marginBottom: 4 },
    subtitle: { color: theme.textMuted, fontSize: theme.fontSM, marginBottom: theme.spaceLG },
    emptyBox: { alignItems: "center", marginTop: 60 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: theme.textPrimary, fontSize: theme.fontMD, fontWeight: "800" },
    emptyHint: { color: theme.textMuted, fontSize: theme.fontSM, marginTop: 6 },
    alertCard: { padding: theme.spaceMD, borderRadius: theme.radiusMD, marginBottom: 10, borderWidth: 1 },
    alertCritical: { backgroundColor: theme.dangerBg, borderColor: theme.danger },
    alertWarning: { backgroundColor: theme.warningBg, borderColor: theme.warning },
    alertHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    alertIcon: { fontSize: 24 },
    alertHive: { color: theme.textPrimary, fontWeight: "900", fontSize: theme.fontMD },
    alertType: { color: theme.textSecondary, fontSize: theme.fontXS, marginTop: 2 },
    scoreBadge: { marginLeft: "auto", width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
    scoreText: { color: "#fff", fontWeight: "900", fontSize: theme.fontSM },
  });
}