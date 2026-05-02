import AsyncStorage from '@react-native-async-storage/async-storage';

export type Hive = {
  id: string;
  name: string;
};

const STORAGE_KEY = 'hives';

export async function getHives(): Promise<Hive[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveHives(hives: Hive[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hives));
}

export async function createHive(name: string) {
  const hives = await getHives();

  const newHive = {
    id: Date.now().toString(),
    name,
  };

  const updated = [...hives, newHive];
  await saveHives(updated);

  return newHive;
}

export async function updateHive(id: string, name: string) {
  const hives = await getHives();

  const updated = hives.map(h =>
    h.id === id ? { ...h, name } : h
  );

  await saveHives(updated);
}