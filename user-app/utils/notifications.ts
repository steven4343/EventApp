import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LAST_CHECK_KEY = 'last_event_notification_check';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getLastCheckTime(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(LAST_CHECK_KEY);
    return stored || new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

export async function setLastCheckTime(time: string): Promise<void> {
  await AsyncStorage.setItem(LAST_CHECK_KEY, time);
}

export async function notifyNewEvent(title: string, eventTitle: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: eventTitle,
      sound: true,
    },
    trigger: null,
  });
}
