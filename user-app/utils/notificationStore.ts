import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = 'cuz_events_notifications_list';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

let cached: AppNotification[] = [];

export async function loadNotifications(): Promise<AppNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    cached = stored ? JSON.parse(stored) : [];
  } catch {
    cached = [];
  }
  return cached;
}

export async function addNotification(notif: AppNotification): Promise<void> {
  cached.unshift(notif);
  if (cached.length > 20) cached = cached.slice(0, 20);
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(cached));
}

export async function markAllRead(): Promise<void> {
  cached.forEach(n => { n.read = true; });
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(cached));
}

export function getCached(): AppNotification[] {
  return cached;
}

export function getUnreadCount(): number {
  return cached.filter(n => !n.read).length;
}
