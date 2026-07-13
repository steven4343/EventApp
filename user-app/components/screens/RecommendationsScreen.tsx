import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Event } from '../../types';
import { userApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { normalizeImage } from '../../utils/image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { Avatar } from '../ui/Avatar';

export function RecommendationsScreen({ requireAuth }: { requireAuth?: () => void }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();
  const ph = horizontalPadding(r);
  const isDesktop = r.width >= 900;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventsTab', { screen: 'EventDetails', params: { eventId: event.id } });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ padding: ph, paddingTop: spacing.xl }}>
          <LoadingSkeleton height={28} width="50%" />
          <LoadingSkeleton height={16} width="70%" style={{ marginTop: spacing.sm }} />
        </View>
        <View style={{ paddingHorizontal: ph, gap: spacing.md }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ height: 120, backgroundColor: colors.skeleton, borderRadius: radius.xl }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const featuredEvents = events.filter(e => e.rating >= 4.7).slice(0, 3);
  const upcomingEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4);
  const freeEvents = events.filter(e => e.price === 0).slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: ph, paddingTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: colors.text }]}>{t('recommendations.title')}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('recommendations.subtitle')}</Text>
          </View>
          {user && (
            <Avatar uri={user.avatar || 'https://picsum.photos/seed/user/200'} name={user.name} size={40} />
          )}
        </View>

        {/* Trending Section */}
        {featuredEvents.length > 0 && (
          <View style={{ marginBottom: spacing.xxl, paddingHorizontal: ph }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[typography.h4, { color: colors.text }]}>🔥 {t('recommendations.trending')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EventsTab')}>
                <Text style={[typography.label, { color: colors.primary }]}>{t('recommendations.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {featuredEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.85}
                  onPress={() => handleEventPress(event)}
                  style={[shadow.md, { width: isDesktop ? 280 : 200, backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden' }]}
                >
                  <Image source={normalizeImage(event.image)} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                  <View style={{ padding: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                      <Text style={{ fontSize: 12, color: colors.warning }}>★</Text>
                      <Text style={[typography.caption, { color: colors.warning }]}>{event.rating}</Text>
                    </View>
                    <Text style={[typography.label, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                      📅 {formatDate(event.date)} · 📍 {(event.location || '').split(',')[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upcoming Section */}
        {upcomingEvents.length > 0 && (
          <View style={{ marginBottom: spacing.xxl, paddingHorizontal: ph }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[typography.h4, { color: colors.text }]}>📅 {t('recommendations.upcomingSoon')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EventsTab')}>
                <Text style={[typography.label, { color: colors.primary }]}>{t('recommendations.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: spacing.sm }}>
              {upcomingEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.85}
                  onPress={() => handleEventPress(event)}
                  style={[shadow.sm, { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md }]}
                >
                  <Image source={normalizeImage(event.image)} style={{ width: 60, height: 60, borderRadius: radius.md }} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>📅 {formatDate(event.date)}</Text>
                    <Text style={[typography.label, { color: colors.primary, marginTop: 2 }]}>
                      {event.price === 0 ? t('eventDetails.free') : `K${event.price}`}
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Free Events */}
        {freeEvents.length > 0 && (
          <View style={{ marginBottom: spacing.xxl, paddingHorizontal: ph }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[typography.h4, { color: colors.text }]}>🎉 {t('recommendations.freeEvents')}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {freeEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.85}
                  onPress={() => handleEventPress(event)}
                  style={[shadow.sm, { width: isDesktop ? '23%' : '47%', backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden' }]}
                >
                  <Image source={normalizeImage(event.image)} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                  <View style={{ padding: spacing.md }}>
                    <Text style={[typography.label, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>{formatDate(event.date)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Pinned */}
        {events.length > 0 && (
          <View style={{ marginBottom: spacing.xxxl, paddingHorizontal: ph }}>
            <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📌 {t('recommendations.pinned')}</Text>
            <View style={{ gap: spacing.sm }}>
              {(() => {
                const highestRated = events.reduce((a, b) => a.rating > b.rating ? a : b);
                const mostAttendees = events.reduce((a, b) => a.attendees > b.attendees ? a : b);
                return [
                  { icon: '📌', title: events[0].title, subtitle: t('recommendations.firstListed'), event: events[0] },
                  { icon: '⭐', title: highestRated.title, subtitle: `${t('recommendations.highestRated')} (${highestRated.rating})`, event: highestRated },
                  { icon: '👥', title: mostAttendees.title, subtitle: `${t('recommendations.mostAttendees')} (${mostAttendees.attendees})`, event: mostAttendees },
                ].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.85}
                    onPress={() => handleEventPress(item.event)}
                    style={[shadow.sm, { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.accent, gap: spacing.md }]}
                  >
                    <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.label, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ));
              })()}
            </View>
          </View>
        )}

        {events.length === 0 && (
          <EmptyState emoji="✨" title={t('recommendations.noEvents')} description={t('recommendations.checkBackLater')} />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
