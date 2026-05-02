import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupNotifications() {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.requestPermissionsAsync();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.log('Notification setup error:', e);
  }
}

export async function sendAlert(title: string, body: string) {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
}