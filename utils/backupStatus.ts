import { getPendingInspectionBackups } from "./localBackup";

export async function getPendingBackupCount() {
  const pending = await getPendingInspectionBackups();
  return pending.length;
}