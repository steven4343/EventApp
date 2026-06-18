import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = 'cuz_events_notifications_list';
const EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

let cached: AppNotification[] = [];

function removeExpired(list: AppNotification[]): AppNotification[] {
  const cutoff = Date.now() - EXPIRY_MS;
  return list.filter(n => new Date(n.timestamp).getTime() > cutoff);
}

async function persist(): Promise<void> {
  cached = removeExpired(cached);
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(cached));
}

export async function loadNotifications(): Promise<AppNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    cached = stored ? JSON.parse(stored) : [];
  } catch {
    cached = [];
  }
  cached = removeExpired(cached);
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(cached));
  return cached;
}

export async function addNotification(notif: AppNotification): Promise<void> {
  await loadNotifications();
  cached.unshift(notif);
  if (cached.length > 20) cached = cached.slice(0, 20);
  await persist();
}

export async function markAllRead(): Promise<void> {
  cached.forEach(n => { n.read = true; });
  await persist();
}

export function getCached(): AppNotification[] {
  return cached;
}

export function getUnreadCount(): number {
  return cached.filter(n => !n.read).length;
}
