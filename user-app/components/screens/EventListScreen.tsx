import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { categories, Event } from '../../types';
import { userApi } from '../../api';
import { EventCard } from './EventCard';
import { loadNotifications, getCached, getUnreadCount, markAllRead, addNotification, AppNotification } from '../../utils/notificationStore';
import { getSocket } from '../../services/socket';

export function EventListScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<View>(null);
  const notifRef = useRef<View>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => refreshNotifs();
    socket.on('notification', handler);
    const statusHandler = (data: { eventId: string; title: string; status: string; timestamp: string }) => {
      const message = data.status === 'Published' ? 'New event published' : `Event ${data.status.toLowerCase()}`;
      addNotification({
        id: `notif_${data.eventId}_${Date.now()}`,
        title: 'Event Update',
        body: `${data.title} — ${message}`,
        timestamp: new Date().toISOString(),
        read: false,
        eventId: data.eventId,
      });
      refreshNotifs();
      userApi.getEvents().then(setEvents);
    };
    socket.on('event:status', statusHandler);
    return () => { socket.off('notification', handler); socket.off('event:status', statusHandler); };
  }, [refreshNotifs]);

  useEffect(() => {
    userApi.getEvents().then(data => {
      setEvents(data);
      data.forEach(e => notifiedIds.current.add(e.id));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const checkNewPublished = async () => {
      try {
        const all = await userApi.getEvents();
        for (const event of all) {
          if (notifiedIds.current.has(event.id)) continue;
          notifiedIds.current.add(event.id);
          await addNotification({
            id: `notif_${event.id}_${Date.now()}`,
            title: 'New Event Posted',
            body: event.title,
            timestamp: new Date().toISOString(),
            read: false,
            eventId: event.id,
          });
          refreshNotifs();
        }
      } catch {}
    };
    const interval = setInterval(checkNewPublished, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifs]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.club.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerContent}>
            <Image source={require('../../assets/cuz-logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Cavendish University Zambia</Text>
              <Text style={styles.headerSubtitle}>Events</Text>
              <Text style={styles.headerTagline}>Discover. Connect. Celebrate.</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.notifButton} onPress={() => { setShowNotifs(!showNotifs); setShowMenu(false); if (!showNotifs) markAllRead().then(refreshNotifs); }}>
              <Text style={styles.notifBell}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
              <Text style={styles.menuDots}>⋮</Text>
            </Pressable>
          </View>
        </View>
        {showNotifs && (
          <>
            <Pressable style={styles.notifOverlay} onPress={() => setShowNotifs(false)} />
            <View style={styles.notifDropdown} ref={notifRef}>
              <Text style={styles.notifHeader}>Notifications</Text>
              {notifications.length === 0 ? (
                <Text style={styles.notifEmpty}>No new notifications</Text>
              ) : (
                <ScrollView style={styles.notifScroll} nestedScrollEnabled>
                  {notifications.map(n => (
                    <Pressable key={n.id} style={[styles.notifItem, !n.read && styles.notifItemUnread]} onPress={() => { if (n.eventId) { setShowNotifs(false); navigation.navigate('EventDetails', { eventId: n.eventId }); } }}>
                      <Text style={styles.notifItemTitle}>{n.title}</Text>
                      <Text style={styles.notifItemBody}>{n.body}</Text>
                      <Text style={styles.notifItemTime}>{new Date(n.timestamp).toLocaleDateString()}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        )}
        {showMenu && (
          <>
            <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)} />
            <View style={styles.dropdown} ref={menuRef}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('EventsTab' as never); }}>
                <Text style={styles.dropdownIcon}>📅</Text>
                <Text style={styles.dropdownText}>Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('ClubsTab' as never); }}>
                <Text style={styles.dropdownIcon}>🏛️</Text>
                <Text style={styles.dropdownText}>Clubs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('Profile'); }}>
                <Text style={styles.dropdownIcon}>👤</Text>
                <Text style={styles.dropdownText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('MyTickets'); }}>
                <Text style={styles.dropdownIcon}>🎫</Text>
                <Text style={styles.dropdownText}>My Tickets</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('SavedEvents'); }}>
                <Text style={styles.dropdownIcon}>❤️</Text>
                <Text style={styles.dropdownText}>Saved Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); navigation.navigate('Settings'); }}>
                <Text style={styles.dropdownIcon}>⚙️</Text>
                <Text style={styles.dropdownText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBell: {
    fontSize: 20,
  },
  notifBadge: {
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
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  notifOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 20,
  },
  notifDropdown: {
    position: 'absolute',
    top: 80,
    right: 16,
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
  notifHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notifEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  notifScroll: {
    maxHeight: 220,
  },
  notifItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  notifItemUnread: {
    backgroundColor: '#eff6ff',
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  notifItemBody: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 2,
  },
  notifItemTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  logo: {
    width: 60,
    height: 50,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bfdbfe',
    marginTop: 2,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#93c5fd',
    marginTop: 1,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 24,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 20,
  },
  dropdown: {
    position: 'absolute',
    top: 88,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 30,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoriesContainer: {
    maxHeight: 44,
    marginTop: 8,
    marginBottom: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});
