/**
 * app/hive/reminders.tsx
 *
 * Inspection Reminder Settings.
 * Global default interval + per-hive overrides.
 * Saves settings to Firestore and schedules local notifications.
 * 
 * 
 */

import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBar from "../../components/NavBar";
import { useAuthContext } from "../../context/AuthContext";
import { useAppTheme } from "../../hooks/useAppTheme";
import { db } from "../../utils/firebase";
import {
  cancelHiveReminder,
  DEFAULT_REMINDER_INTERVAL,
  INTERVAL_OPTIONS,
  requestNotificationPermissions,
  scheduleHiveReminder,
  setupNotificationChannel,
} from "../../utils/reminders";

// Extended interval options for per-hive overrides — includes short emergency intervals
const HIVE_INTERVAL_OPTIONS: { value: number; label: string; tag?: string }[] = [
  { value: 1,  label: "day",  tag: "🚨 Today" },
  { value: 2,  label: "days", tag: "🚨 Urgent" },
  { value: 3,  label: "days", tag: "⚠️ Soon" },
  { value: 5,  label: "days", tag: "⚠️ Watch" },
  { value: 7,  label: "days" },
  { value: 10, label: "days" },
  { value: 14, label: "days" },
  { value: 21, label: "days" },
  { value: 30, label: "days" },
];

type HiveSetting = {
  id: string;
  name: string;
  enabled: boolean;
  interval: number | null; // null = use global default
};

export default function RemindersScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [globalInterval, setGlobalInterval] = useState(DEFAULT_REMINDER_INTERVAL);
  const [hiveSettings, setHiveSettings] = useState<HiveSetting[]>([]);
  const [showIntervalPicker, setShowIntervalPicker] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const globalDoc = await getDocs(
        query(collection(db, "userSettings"), where("userId", "==", user.uid))
      );
      if (!globalDoc.empty) {
        const data = globalDoc.docs[0].data();
        setGlobalEnabled(data.remindersEnabled ?? false);
        setGlobalInterval(data.reminderInterval ?? DEFAULT_REMINDER_INTERVAL);
      }

      const hiveSnap = await getDocs(
        query(collection(db, "hives"), where("userId", "==", user.uid))
      );
      const settings: HiveSetting[] = hiveSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "Unnamed Hive",
          enabled: data.reminderEnabled ?? true,
          interval: data.reminderInterval ?? null,
        };
      });
      setHiveSettings(settings);
    } catch (e) {
      console.log("Load reminders error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setupNotificationChannel();

      if (globalEnabled) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please allow notifications in your device settings to use reminders."
          );
          setSaving(false);
          return;
        }
      }

      await setDoc(doc(db, "userSettings", user.uid), {
        userId: user.uid,
        remindersEnabled: globalEnabled,
        reminderInterval: globalInterval,
      }, { merge: true });

      for (const hive of hiveSettings) {
        await setDoc(doc(db, "hives", hive.id), {
          reminderEnabled: hive.enabled,
          reminderInterval: hive.interval,
        }, { merge: true });

        const effectiveInterval = hive.interval ?? globalInterval;
        const shouldRemind = globalEnabled && hive.enabled;

        if (shouldRemind) {
          await scheduleHiveReminder(hive.id, hive.name, effectiveInterval);
        } else {
          await cancelHiveReminder(hive.id);
        }
      }

      Alert.alert("Saved! 🐝", "Reminder settings updated.");
    } catch (e) {
      Alert.alert("Error", "Could not save settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateHive = (id: string, changes: Partial<HiveSetting>) => {
    setHiveSettings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...changes } : h))
    );
  };

  const S = makeStyles(theme);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.honey} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={S.page}>
      <NavBar />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.title}>🔔 Inspection Reminders</Text>
        <Text style={S.subtitle}>Get notified when your hives are due for inspection</Text>

        {/* Global toggle */}
        <View style={S.card}>
          <View style={S.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.cardTitle}>Enable Reminders</Text>
              <Text style={S.cardSubtitle}>Receive push notifications when inspections are due</Text>
            </View>
            <Switch
              value={globalEnabled}
              onValueChange={setGlobalEnabled}
              trackColor={{ false: theme.border, true: theme.honey }}
              thumbColor={globalEnabled ? theme.honeyLight : theme.textMuted}
            />
          </View>
        </View>

        {/* Global interval — standard intervals only */}
        {globalEnabled && (
          <View style={S.card}>
            <Text style={S.cardTitle}>Default Interval</Text>
            <Text style={S.cardSubtitle}>How often to remind you — applies to all hives unless overridden</Text>
            <View style={S.intervalGrid}>
              {INTERVAL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setGlobalInterval(opt.value)}
                  style={[S.intervalOption, globalInterval === opt.value && S.intervalOptionSelected]}
                >
                  <Text style={[S.intervalDays, globalInterval === opt.value && S.intervalDaysSelected]}>
                    {opt.value}
                  </Text>
                  <Text style={[S.intervalLabel, globalInterval === opt.value && S.intervalLabelSelected]}>
                    day{opt.value === 1 ? "" : "s"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Per-hive overrides */}
        {globalEnabled && hiveSettings.length > 0 && (
          <>
            <Text style={S.sectionLabel}>PER-HIVE SETTINGS</Text>
            <Text style={S.sectionHint}>Override the default interval for individual hives — use shorter intervals for hives with pest pressure or concerns</Text>

            {hiveSettings.map((hive) => {
              const selectedOpt = HIVE_INTERVAL_OPTIONS.find((o) => o.value === hive.interval);
              return (
                <View key={hive.id} style={S.hiveCard}>
                  <View style={S.hiveCardHeader}>
                    <Text style={S.hiveName}>🏠 {hive.name}</Text>
                    <Switch
                      value={hive.enabled}
                      onValueChange={(v) => updateHive(hive.id, { enabled: v })}
                      trackColor={{ false: theme.border, true: theme.honey }}
                      thumbColor={hive.enabled ? theme.honeyLight : theme.textMuted}
                    />
                  </View>

                  {hive.enabled && (
                    <View style={S.hiveIntervalRow}>
                      <Text style={S.hiveIntervalLabel}>
                        Interval:{" "}
                        {hive.interval
                          ? `${hive.interval} days${selectedOpt?.tag ? ` ${selectedOpt.tag}` : ""}`
                          : `Global default (${globalInterval} days)`}
                      </Text>
                      <Pressable
                        onPress={() => setShowIntervalPicker(showIntervalPicker === hive.id ? null : hive.id)}
                        style={S.overrideButton}
                      >
                        <Text style={S.overrideButtonText}>
                          {hive.interval ? "Change" : "Override"}
                        </Text>
                      </Pressable>
                      {hive.interval && (
                        <Pressable
                          onPress={() => updateHive(hive.id, { interval: null })}
                          style={S.resetButton}
                        >
                          <Text style={S.resetButtonText}>Reset</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {showIntervalPicker === hive.id && hive.enabled && (
                    <View style={{ marginTop: 12 }}>
                      {/* Emergency section */}
                      <Text style={S.intervalGroupLabel}>🚨 EMERGENCY / PEST WATCH</Text>
                      <View style={S.intervalGrid}>
                        {HIVE_INTERVAL_OPTIONS.filter((o) => o.value <= 5).map((opt) => (
                          <Pressable
                            key={opt.value}
                            onPress={() => {
                              updateHive(hive.id, { interval: opt.value });
                              setShowIntervalPicker(null);
                            }}
                            style={[S.intervalOption, S.intervalOptionUrgent, hive.interval === opt.value && S.intervalOptionSelected]}
                          >
                            <Text style={[S.intervalDays, hive.interval === opt.value && S.intervalDaysSelected]}>
                              {opt.value}
                            </Text>
                            <Text style={[S.intervalLabel, hive.interval === opt.value && S.intervalLabelSelected]}>
                              {opt.label}
                            </Text>
                            {opt.tag && (
                              <Text style={[S.intervalTag, hive.interval === opt.value && { color: theme.bg }]}>
                                {opt.tag}
                              </Text>
                            )}
                          </Pressable>
                        ))}
                      </View>

                      {/* Regular section */}
                      <Text style={[S.intervalGroupLabel, { marginTop: 10 }]}>📅 REGULAR INTERVALS</Text>
                      <View style={S.intervalGrid}>
                        {HIVE_INTERVAL_OPTIONS.filter((o) => o.value > 5).map((opt) => (
                          <Pressable
                            key={opt.value}
                            onPress={() => {
                              updateHive(hive.id, { interval: opt.value });
                              setShowIntervalPicker(null);
                            }}
                            style={[S.intervalOption, hive.interval === opt.value && S.intervalOptionSelected]}
                          >
                            <Text style={[S.intervalDays, hive.interval === opt.value && S.intervalDaysSelected]}>
                              {opt.value}
                            </Text>
                            <Text style={[S.intervalLabel, hive.interval === opt.value && S.intervalLabelSelected]}>
                              {opt.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {hiveSettings.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyText}>No hives yet — add a hive first to set reminders.</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[S.saveButton, saving && S.disabledButton]}
        >
          <Text style={S.saveText}>{saving ? "Saving..." : "💾 Save Reminder Settings"}</Text>
        </Pressable>
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
    sectionLabel: { color: theme.textMuted, fontSize: theme.fontXS, fontWeight: "800", letterSpacing: 1.5, marginTop: theme.spaceLG, marginBottom: 4 },
    sectionHint: { color: theme.textMuted, fontSize: theme.fontXS, fontStyle: "italic", marginBottom: theme.spaceSM },
    card: { backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, padding: theme.spaceMD, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
    cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardTitle: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontMD, marginBottom: 4 },
    cardSubtitle: { color: theme.textMuted, fontSize: theme.fontXS },
    intervalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: theme.spaceSM },
    intervalGroupLabel: { color: theme.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
    intervalOption: { backgroundColor: theme.bgCardAlt, borderRadius: theme.radiusMD, borderWidth: 2, borderColor: theme.border, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center", minWidth: 64 },
    intervalOptionUrgent: { borderColor: theme.warning },
    intervalOptionSelected: { borderColor: theme.honey, backgroundColor: theme.honey },
    intervalDays: { color: theme.textPrimary, fontSize: 20, fontWeight: "900" },
    intervalDaysSelected: { color: theme.bg },
    intervalLabel: { color: theme.textMuted, fontSize: theme.fontXS },
    intervalLabelSelected: { color: theme.bg },
    intervalTag: { color: theme.warning, fontSize: 9, fontWeight: "800", marginTop: 2, textAlign: "center" },
    hiveCard: { backgroundColor: theme.bgCard, borderRadius: theme.radiusLG, padding: theme.spaceMD, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
    hiveCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    hiveName: { color: theme.textPrimary, fontWeight: "800", fontSize: theme.fontMD, flex: 1 },
    hiveIntervalRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    hiveIntervalLabel: { color: theme.textMuted, fontSize: theme.fontXS, flex: 1 },
    overrideButton: { backgroundColor: theme.bgCardAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.honey },
    overrideButtonText: { color: theme.honey, fontWeight: "800", fontSize: theme.fontXS },
    resetButton: { backgroundColor: theme.bgCardAlt, paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.radiusSM, borderWidth: 1, borderColor: theme.border },
    resetButtonText: { color: theme.textMuted, fontWeight: "700", fontSize: theme.fontXS },
    emptyBox: { alignItems: "center", marginTop: 32 },
    emptyText: { color: theme.textMuted, fontSize: theme.fontSM, textAlign: "center" },
    saveButton: { backgroundColor: theme.green, padding: 18, borderRadius: theme.radiusMD, alignItems: "center", marginTop: theme.spaceLG },
    disabledButton: { backgroundColor: theme.textMuted },
    saveText: { color: "#fff", fontWeight: "900", fontSize: theme.fontMD },
  });
}
