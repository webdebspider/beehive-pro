import AsyncStorage from '@react-native-async-storage/async-storage';

export const getHives = async () => {
  const data = await AsyncStorage.getItem('hives');
  return data ? JSON.parse(data) : [];
};

export const saveHives = async (hives: any[]) => {
  await AsyncStorage.setItem('hives', JSON.stringify(hives));
};

export const getInspections = async (hiveId: string) => {
  const data = await AsyncStorage.getItem(`inspections_${hiveId}`);
  return data ? JSON.parse(data) : [];
};

export const getAlerts = async () => {
  const data = await AsyncStorage.getItem('alerts');
  return data ? JSON.parse(data) : [];
};

export const saveInspection = async (hiveId: string, inspection: any) => {
  const existing = await getInspections(hiveId);
  const updated = [inspection, ...existing];
  await AsyncStorage.setItem(`inspections_${hiveId}`, JSON.stringify(updated));

  // 🚨 ALERT LOGIC
  let alerts = await getAlerts();

  if (inspection.score < 70) {
    alerts.unshift({
      id: Date.now().toString(),
      hiveId,
      score: inspection.score,
      date: inspection.date,
      type: 'critical',
    });
  } else if (inspection.score < 85) {
    alerts.unshift({
      id: Date.now().toString(),
      hiveId,
      score: inspection.score,
      date: inspection.date,
      type: 'warning',
    });
  }

  await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
};