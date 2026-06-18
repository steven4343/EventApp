import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { loadNotifications, getCached, getUnreadCount, markAllRead, AppNotification } from '../utils/notificationStore';

export default function NotificationDropdown() {
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
    const interval = setInterval(refreshNotifs, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifs]);

  return (
    <View>
      <Pressable
        style={styles.bellButton}
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
          <View style={styles.dropdown}>
            <Text style={styles.header}>Notifications</Text>
            {notifications.length === 0 ? (
              <Text style={styles.empty}>No new notifications</Text>
            ) : (
              <ScrollView style={styles.scroll} nestedScrollEnabled>
                {notifications.map(n => (
                  <Pressable key={n.id} style={[styles.item, !n.read && styles.itemUnread]} onPress={() => setShowNotifs(false)}>
                    <Text style={styles.itemTitle}>{n.title}</Text>
                    <Text style={styles.itemBody}>{n.body}</Text>
                    <Text style={styles.itemTime}>{new Date(n.timestamp).toLocaleDateString()}</Text>
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 280,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 30,
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  empty: {
    fontSize: 14,
    color: '#94a3b8',
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
    borderBottomColor: '#f8fafc',
  },
  itemUnread: {
    backgroundColor: '#eff6ff',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  itemBody: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
