import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { loadNotifications, getCached, getUnreadCount, markAllRead, AppNotification } from '../utils/notificationStore';
import { useTheme } from '../context/ThemeContext';

interface NotificationDropdownProps {
  refreshTrigger?: number;
}

export default function NotificationDropdown({ refreshTrigger }: NotificationDropdownProps) {
  const { colors, isDark } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifs = useCallback(async () => {
    await loadNotifications();
    setNotifications([...getCached()]);
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    refreshNotifs();
    const interval = setInterval(refreshNotifs, 15000);
    return () => clearInterval(interval);
  }, [refreshNotifs]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refreshNotifs();
    }
  }, [refreshTrigger, refreshNotifs]);

  return (
    <View>
      <Pressable
        style={[styles.bellButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        onPress={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead().then(refreshNotifs); }}
      >
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>
      {showNotifs && (
        <>
          <Pressable style={styles.overlay} onPress={() => setShowNotifs(false)} />
          <View style={[styles.dropdown, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.header, { color: colors.text, borderBottomColor: colors.border }]}>Notifications</Text>
            {notifications.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>No new notifications</Text>
            ) : (
              <ScrollView style={styles.scroll} nestedScrollEnabled>
                {notifications.map(n => (
                  <Pressable
                    key={n.id}
                    style={[styles.item, !n.read && { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eff6ff' }, { borderBottomColor: colors.border }]}
                    onPress={() => setShowNotifs(false)}
                  >
                    <Text style={[styles.itemTitle, { color: colors.primary }]}>{n.title}</Text>
                    <Text style={[styles.itemBody, { color: colors.text }]}>{n.body}</Text>
                    <Text style={[styles.itemTime, { color: colors.textMuted }]}>{new Date(n.timestamp).toLocaleString()}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 20,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 280,
    maxHeight: 300,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 30,
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  scroll: {
    maxHeight: 220,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemBody: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    marginTop: 2,
  },
});
