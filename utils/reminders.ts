/**
 * utils/reminders.ts
 *
 * Inspection reminder utilities.
 * Handles notification permissions, scheduling, and due status calculation.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ── Notification Setup ────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("hive-reminders", {
      name: "Hive Inspection Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#f59e0b",
      sound: "default",
    });
  }
}

// ── Schedule / Cancel ─────────────────────────────────────────────────────────

export async function scheduleHiveReminder(
  hiveId: string,
  hiveName: string,
  intervalDays: number
): Promise<string | null> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    await cancelHiveReminder(hiveId);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🐝 Hive Inspection Due",
        body: `Time to check on ${hiveName || "your hive"}!`,
        data: { hiveId },
        sound: "default",
      },
      trigger: {
        seconds: intervalDays * 24 * 60 * 60,
        repeats: false,
        channelId: "hive-reminders",
      } as any,
    });

    return id;
  } catch (e) {
    console.log("Schedule reminder error:", e);
    return null;
  }
}

export async function cancelHiveReminder(hiveId: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.hiveId === hiveId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.log("Cancel reminder error:", e);
  }
}

// ── Due Status ────────────────────────────────────────────────────────────────

export type DueStatus = "overdue" | "due_soon" | "ok" | "never_inspected";

export function getDueStatus(
  lastInspectionDate: string | null | undefined,
  intervalDays: number
): DueStatus {
  if (!lastInspectionDate) return "never_inspected";

  const last = new Date(lastInspectionDate);
  if (isNaN(last.getTime())) return "never_inspected";

  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince >= intervalDays) return "overdue";
  if (daysSince >= intervalDays - 3) return "due_soon";
  return "ok";
}

export function getDueLabel(status: DueStatus): string {
  switch (status) {
    case "overdue": return "⚠️ Overdue";
    case "due_soon": return "🔔 Due Soon";
    case "ok": return "✅ Up to Date";
    case "never_inspected": return "🔍 Never Inspected";
  }
}

export function getDaysSince(lastInspectionDate: string | null | undefined): number | null {
  if (!lastInspectionDate) return null;
  const last = new Date(lastInspectionDate);
  if (isNaN(last.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export const DEFAULT_REMINDER_INTERVAL = 14;

export const INTERVAL_OPTIONS = [
  { label: "Every 7 days", value: 7 },
  { label: "Every 10 days", value: 10 },
  { label: "Every 14 days (recommended)", value: 14 },
  { label: "Every 21 days", value: 21 },
  { label: "Every 30 days", value: 30 },
];
