/**
 * offlineQueue.ts
 *
 * Manages a persistent queue of photo uploads that failed due to being offline.
 * Uses AsyncStorage to persist the queue across app restarts.
 *
 * Flow:
 *  1. User saves an inspection while offline → photos get added to this queue
 *  2. App detects network is restored → processQueue() retries all queued uploads
 *  3. Successfully uploaded items are removed from the queue
 *
 * Used by:
 *  - app/hive/inspection/add.tsx (adds to queue when offline)
 *  - utils/syncQueue.ts (processes queue when back online)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// The key used to store the queue in AsyncStorage
const QUEUE_KEY = "offline_upload_queue";

/**
 * Represents a single queued upload job.
 * Stores everything needed to retry the upload later.
 */
export type QueuedUpload = {
  id: string;          // Unique ID for this queue item
  hiveId: string;      // Firestore hive document ID
  inspectionId: string; // Firestore inspection document ID
  photoUris: string[]; // Local device URIs of photos to upload
  queuedAt: string;    // ISO timestamp of when it was queued
};

/**
 * Adds a new upload job to the offline queue.
 * Called when a photo upload fails due to no network connection.
 */
export async function addToQueue(item: Omit<QueuedUpload, "id" | "queuedAt">) {
  const queue = await getQueue();
  const newItem: QueuedUpload = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    queuedAt: new Date().toISOString(),
  };
  queue.push(newItem);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Returns the full current queue.
 * Returns empty array if queue is empty or unreadable.
 */
export async function getQueue(): Promise<QueuedUpload[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Removes a single item from the queue by its ID.
 * Called after a queued upload succeeds.
 */
export async function removeFromQueue(id: string) {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

/**
 * Wipes the entire queue.
 * Use with caution — only call this if you're sure all items have been processed.
 */
export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}