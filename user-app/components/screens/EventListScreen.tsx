import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories, Event } from '../../types';
import { userApi } from '../../api';
import { loadNotifications, getCached, getUnreadCount, markAllRead, addNotification, AppNotification } from '../../utils/notificationStore';
import { getSocket } from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { SearchBar, CategoryChips } from '../ui/SearchBar';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';
import { EventCard } from './EventCard';

export function EventListScreen() {
  const navigation = useNavigation<any>();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();
  const ph = horizontalPadding(r);
  const isDesktop = r.width >= 900;
  const gridCols = isDesktop ? (r.width >= 1280 ? 4 : r.width >= 1024 ? 3 : 2) : r.width >= 600 ? 2 : 1;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    });
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.club.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const cardWidth = `${100 / gridCols - 1}%`;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ padding: ph }}>
          <View style={{ height: 60, backgroundColor: colors.skeleton, borderRadius: radius.xl, marginBottom: spacing.lg }} />
          <View style={{ height: 44, backgroundColor: colors.skeleton, borderRadius: radius.full, marginBottom: spacing.md }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ height: 36, width: 80, backgroundColor: colors.skeleton, borderRadius: radius.full }} />
            ))}
          </View>
        </View>
        <View style={{ flex: 1, padding: ph }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={{ flex: 1, minWidth: 200 }}>
                <LoadingSkeleton height={200} borderRadius={radius.xl} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: `${100 / gridCols}%`, padding: spacing.sm }}>
            <EventCard event={item} onPress={() => handleEventPress(item)} />
          </View>
        )}
        numColumns={gridCols}
        contentContainerStyle={{ paddingHorizontal: ph, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md }}>
              <Image
                source={require('../../assets/cuz-logo.png')}
                style={{ width: isDesktop ? 48 : 40, height: isDesktop ? 48 : 40, borderRadius: radius.md }}
                resizeMode="contain"
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.h2, { color: colors.text }]}>CUZ Events</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('app.tagline')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pressable
                  onPress={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead().then(refreshNotifs); }}
                  style={{
                    width: 40, height: 40, borderRadius: radius.full,
                    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute', top: 4, right: 4,
                      backgroundColor: colors.danger, borderRadius: radius.full,
                      width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={[typography.overline, { color: '#fff', fontSize: 9 }]}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Notifications dropdown */}
            {showNotifs && (
              <>
                <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -500, zIndex: 20 }} onPress={() => setShowNotifs(false)} />
                <View style={[shadow.xl, {
                  backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
                  marginBottom: spacing.md, zIndex: 30, maxHeight: 250,
                  borderColor: colors.border, borderWidth: 1,
                }]}>
                  <Text style={[typography.label, { color: colors.text, marginBottom: spacing.md }]}>
                    {t('events.notifications')}
                  </Text>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                    {notifications.length === 0 ? (
                      <Text style={[typography.bodySmall, { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }]}>
                        {t('events.noNotifications')}
                      </Text>
                    ) : (
                      notifications.map(n => (
                        <Pressable
                          key={n.id}
                          onPress={() => { if (n.eventId) { setShowNotifs(false); navigation.navigate('EventDetails', { eventId: n.eventId }); } }}
                          style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
                        >
                          <Text style={[typography.label, { color: colors.primary }]}>{n.title}</Text>
                          <Text style={[typography.bodySmall, { color: colors.text }]}>{n.body}</Text>
                          <Text style={[typography.caption, { color: colors.textMuted }]}>{new Date(n.timestamp).toLocaleDateString()}</Text>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Search */}
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('events.search')}
            />

            {/* Categories */}
            <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
              <CategoryChips
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📅"
            title={t('events.noEvents')}
            description="Try adjusting your search or filters"
          />
        }
      />
    </SafeAreaView>
  );
}
