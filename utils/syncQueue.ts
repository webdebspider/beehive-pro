/**
 * syncQueue.ts
 *
 * Processes the offline upload queue when network connectivity is restored.
 * Retries all queued photo uploads and updates the corresponding Firestore docs.
 *
 * Flow:
 *  1. App detects network restored (via useNetworkStatus)
 *  2. processSyncQueue() is called
 *  3. Each queued item is retried via uploadInspectionPhotos
 *  4. On success → Firestore doc is updated + item removed from queue
 *  5. On failure → item stays in queue for next retry
 *
 * Used by:
 *  - app/hive/[id].tsx (wired via useEffect watching isOnline)
 */

import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getQueue, removeFromQueue } from "./offlineQueue";
import { uploadInspectionPhotos } from "./uploadInspectionPhotos";

/**
 * Attempts to upload all items currently sitting in the offline queue.
 * Called automatically when the device comes back online.
 *
 * @param onProgress - optional callback to report status (e.g. for UI feedback)
 */
export async function processSyncQueue(
  onProgress?: (message: string) => void
) {
  const queue = await getQueue();

  if (queue.length === 0) {
    return; // Nothing to sync
  }

  onProgress?.(`Syncing ${queue.length} pending upload(s)...`);

  for (const item of queue) {
    try {
      // Retry the photo upload for this queued item
      const uploadedUrls = await uploadInspectionPhotos(
        item.hiveId,
        item.inspectionId,
        item.photoUris
      );

      // Update the Firestore inspection doc with the now-uploaded URLs
      await updateDoc(
        doc(db, "hives", item.hiveId, "inspections", item.inspectionId),
        {
          photoUris: uploadedUrls,
          photoUrls: uploadedUrls,
          photosUploaded: true,
          syncedAt: new Date(),
        }
      );

      // Remove from queue now that it succeeded
      await removeFromQueue(item.id);

      onProgress?.(`✅ Synced inspection ${item.inspectionId}`);
    } catch (e) {
      // Leave it in the queue — will retry next time online
      console.log("❌ SYNC FAILED for item:", item.id, e);
      onProgress?.(`⚠️ Sync failed for one item — will retry later`);
    }
  }
}