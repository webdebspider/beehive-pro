/**
 * utils/syncQueue.ts
 *
 * Processes the offline upload queue — retries photo uploads that were
 * deferred because the device was offline.
 *
 * Flow:
 *  1. useSyncQueue detects network restored → calls processQueue()
 *  2. processQueue() iterates every item in the AsyncStorage queue
 *  3. Each item: upload photos → update Firestore doc → remove from queue
 *  4. Failed items stay in queue for the next sync attempt
 *
 * Used by:
 *  - utils/useSyncQueue.ts (auto-triggered on reconnect)
 */

import { doc, updateDoc } from "firebase/firestore";
import { getQueue, removeFromQueue } from "./offlineQueue";
import { uploadInspectionPhotos } from "./uploadInspectionPhotos";
import { db } from "./firebase";

export type SyncResult = { synced: number; failed: number };

/**
 * Processes all queued uploads.
 * @param onProgress — called after each item with the number still remaining
 */
export async function processQueue(
  onProgress?: (remaining: number) => void
): Promise<SyncResult> {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const urls = await uploadInspectionPhotos(
        item.hiveId,
        item.inspectionId,
        item.photoUris
      );
      await updateDoc(
        doc(db, "hives", item.hiveId, "inspections", item.inspectionId),
        {
          photoUris: urls,
          photoUrls: urls,
          photosUploaded: true,
          syncedAt: new Date(),
        }
      );
      await removeFromQueue(item.id);
      synced++;
      onProgress?.(queue.length - synced);
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
