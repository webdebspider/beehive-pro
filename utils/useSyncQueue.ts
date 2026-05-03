/**
 * utils/useSyncQueue.ts
 *
 * Hook that watches network status and automatically processes the offline
 * upload queue when the device comes back online.
 *
 * Returns:
 *  - isOnline: boolean
 *  - status: "idle" | "syncing" | "done" | "error"
 *  - pendingCount: number of items still waiting to upload
 *  - syncedCount: number successfully synced in the last run
 *  - triggerSync: manually kick off a sync attempt
 *
 * Used by:
 *  - components/OfflineBanner.tsx
 */

import { useEffect, useRef, useState } from "react";
import { getQueue } from "./offlineQueue";
import { processQueue } from "./syncQueue";
import { useNetworkStatus } from "./useNetworkStatus";

export type SyncStatus = "idle" | "syncing" | "done" | "error";

export function useSyncQueue() {
  const isOnline = useNetworkStatus();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const wasOffline = useRef(false);
  const isSyncing = useRef(false);

  // Check pending count on mount
  useEffect(() => {
    refreshPendingCount();
  }, []);

  // Track offline → online transition and auto-sync
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      refreshPendingCount();
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      triggerSync();
    }
  }, [isOnline]);

  const refreshPendingCount = async () => {
    const queue = await getQueue();
    setPendingCount(queue.length);
  };

  const triggerSync = async () => {
    if (isSyncing.current) return;
    const queue = await getQueue();
    if (queue.length === 0) return;

    isSyncing.current = true;
    setStatus("syncing");
    try {
      const { synced, failed } = await processQueue((remaining) => {
        setPendingCount(remaining);
      });
      setSyncedCount(synced);
      setPendingCount(failed);
      setStatus(failed > 0 ? "error" : "done");
    } catch {
      setStatus("error");
    } finally {
      isSyncing.current = false;
      // Reset to idle after 4 seconds so banner fades away
      setTimeout(() => {
        setStatus("idle");
        setSyncedCount(0);
      }, 4000);
    }
  };

  return { isOnline, status, pendingCount, syncedCount, triggerSync };
}
