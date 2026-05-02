import AsyncStorage from "@react-native-async-storage/async-storage";

export type PendingInspectionBackup = {
  id: string;
  hiveId: string;
  queen?: string;
  brood?: string;
  mites?: number | string | null;
  hiveBeetles?: string;
  temperament?: string;
  notes?: string;
  date: string;
  createdAt: string;
  synced: boolean;
};

const PENDING_INSPECTIONS_KEY = "pending_inspection_backups";

export async function savePendingInspectionBackup(
  inspection: PendingInspectionBackup
) {
  const existing = await getPendingInspectionBackups();

  const updated = [
    ...existing.filter((item) => item.id !== inspection.id),
    inspection,
  ];

  await AsyncStorage.setItem(PENDING_INSPECTIONS_KEY, JSON.stringify(updated));
}

export async function getPendingInspectionBackups() {
  const raw = await AsyncStorage.getItem(PENDING_INSPECTIONS_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as PendingInspectionBackup[];
  } catch {
    return [];
  }
}

export async function removePendingInspectionBackup(id: string) {
  const existing = await getPendingInspectionBackups();

  const updated = existing.filter((item) => item.id !== id);

  await AsyncStorage.setItem(PENDING_INSPECTIONS_KEY, JSON.stringify(updated));
}