import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "offline_upload_queue";

export type QueuedUpload = {
  id: string;
  hiveId: string;
  inspectionId: string;
  photoUris: string[];
  queuedAt: string;
};

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

export async function getQueue(): Promise<QueuedUpload[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removeFromQueue(id: string) {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}