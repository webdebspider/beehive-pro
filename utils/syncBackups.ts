import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import {
    getPendingInspectionBackups,
    removePendingInspectionBackup,
} from "./localBackup";

export async function syncPendingInspectionBackups() {
  const pending = await getPendingInspectionBackups();

  if (pending.length === 0) {
    return {
      synced: 0,
      remaining: 0,
    };
  }

  let synced = 0;

  for (const item of pending) {
    try {
      await addDoc(collection(db, "hives", item.hiveId, "inspections"), {
        hiveId: item.hiveId,
        queen: item.queen || "",
        brood: item.brood || "",
        mites: item.mites ?? null,
        hiveBeetles: item.hiveBeetles || "",
        temperament: item.temperament || "",
        notes: item.notes || "",
        date: item.date,
        createdAt: new Date(item.createdAt),
        syncedFromLocalBackup: true,
      });

      await removePendingInspectionBackup(item.id);
      synced += 1;
    } catch (e) {
      console.log("❌ SYNC BACKUP FAILED:", item.id, e);
    }
  }

  const remaining = await getPendingInspectionBackups();

  return {
    synced,
    remaining: remaining.length,
  };
}