import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getSocket } from '../services/socket';
import { userApi } from '../api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eventapp-production-9af6.up.railway.app/api';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = userApi.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (append = false) => {
    setLoading(true);
    try {
      const p = append ? page : 1;
      const res = await fetch(`${API_URL}/notifications/${userId}?page=${p}&limit=10`, { headers: authHeaders() });
      const data = await res.json();
      if (append) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      setUnread(data.unreadCount);
      setHasMore(data.notifications.length === 10);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setPage(1);
      fetchNotifications();
    }
  }, [visible]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      setPage(1);
      fetchNotifications();
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ userId }),
      });
      fetchNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId }),
      });
      fetchNotifications();
    } catch {}
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.bell}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
              <View style={styles.headerRight}>
                {unread > 0 && (
                  <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markAll}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, !item.isRead && styles.unreadItem]}
                    onPress={() => markAsRead(item.id)}
                  >
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                    <Text style={styles.itemDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                )}
                ListFooterComponent={
                  hasMore ? (
                    <TouchableOpacity
                      onPress={() => { setPage(p => p + 1); fetchNotifications(true); }}
                      disabled={loading}
                      style={styles.loadMore}
                    >
                      <Text style={styles.loadMoreText}>
                        {loading ? 'Loading...' : 'Load more'}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bell: {
    padding: 8,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  markAll: {
    fontSize: 12,
    color: '#2563eb',
  },
  close: {
    fontSize: 18,
    color: '#64748b',
    padding: 4,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
  },
  item: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  unreadItem: {
    backgroundColor: '#eff6ff',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemMessage: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  loadMore: {
    padding: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#2563eb',
    fontSize: 13,
  },
});
