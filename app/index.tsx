/**
 * app/index.tsx
 *
 * Root index — entry point of the app.
 * Redirects to the hive dashboard.
 *
 * Note: This file uses AsyncStorage-based hive/alert data (utils/storage.ts).
 * The main hive dashboard is at app/hive/index.tsx which uses Firebase.
 * TODO: Consolidate to Firebase-only when auth is wired up.
 */

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getAlerts, getHives } from "../utils/storage";
import { T } from "../utils/theme";

export default function Dashboard() {
  const router = useRouter();
  const [hives, setHives] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHives().then(setHives);
      getAlerts().then(setAlerts);
    }, [])
  );

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🐝</Text>
          <View>
            <Text style={styles.title}>Beehive Pro</Text>
            <Text style={styles.subtitle}>
              {hives.length} hive{hives.length === 1 ? "" : "s"} · {alerts.length} alert{alerts.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {/* Alert banner */}
        {alerts.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>
              {alerts.length} active alert{alerts.length === 1 ? "" : "s"}
            </Text>
          </View>
        )}

        {/* Section label */}
        <Text style={styles.sectionLabel}>YOUR HIVES</Text>

        {/* Hive list */}
        <FlatList
          data={hives}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🪣</Text>
              <Text style={styles.emptyText}>No hives yet</Text>
              <Text style={styles.emptyHint}>Tap + to add your first hive</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/hive/[id]", params: { id: item.id } })}
              style={styles.hiveCard}
            >
              <View style={styles.hiveIconBox}>
                <Text style={styles.hiveIcon}>🏠</Text>
              </View>
              <Text style={styles.hiveName}>{item.name}</Text>
              <Text style={styles.hiveArrow}>→</Text>
            </Pressable>
          )}
        />
      </View>

      {/* FAB — Add Hive */}
      <Pressable
        onPress={() => router.push("/hive/add")}
        style={styles.fab}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  content: { flex: 1, padding: T.spaceMD },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: T.spaceLG },
  headerEmoji: { fontSize: 40 },
  title: { color: T.textPrimary, fontSize: T.fontLG, fontWeight: "900" },
  subtitle: { color: T.textMuted, fontSize: T.fontSM, marginTop: 2 },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.warningBg,
    borderWidth: 1,
    borderColor: T.warning,
    padding: T.spaceMD,
    borderRadius: T.radiusMD,
    marginBottom: T.spaceMD,
  },
  alertIcon: { fontSize: 20 },
  alertText: { color: T.honeyLight, fontWeight: "800", fontSize: T.fontSM },
  sectionLabel: {
    color: T.textMuted,
    fontSize: T.fontXS,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: T.spaceSM,
  },
  hiveCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.bgCard,
    padding: T.spaceMD,
    borderRadius: T.radiusMD,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
  },
  hiveIconBox: {
    width: 40,
    height: 40,
    backgroundColor: T.bgCardAlt,
    borderRadius: T.radiusSM,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  hiveIcon: { fontSize: 20 },
  hiveName: { flex: 1, color: T.textPrimary, fontSize: T.fontMD, fontWeight: "800" },
  hiveArrow: { color: T.honey, fontSize: 18, fontWeight: "900" },
  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: T.textPrimary, fontSize: T.fontMD, fontWeight: "800" },
  emptyHint: { color: T.textMuted, fontSize: T.fontSM, marginTop: 6 },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: T.honey,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: { fontSize: 30, color: T.bg, fontWeight: "900" },
});