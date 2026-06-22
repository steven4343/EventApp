import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Event } from '../../types';
import { userApi } from '../../api';

import { useAuth } from '../../context/AuthContext';
import { normalizeImage } from '../../utils/image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function RecommendationsScreen({ requireAuth }: { requireAuth?: () => void }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const featuredEvents = events.filter(e => e.rating >= 4.7).slice(0, 3);
  const upcomingEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4);
  const freeEvents = events.filter(e => e.price === 0).slice(0, 4);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventsTab', { screen: 'EventDetails', params: { eventId: event.id } });
  };

  const handleSeeAll = (filter: 'trending' | 'upcoming' | 'free') => {
    navigation.navigate('EventsTab', { screen: 'EventList' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('recommendations.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('recommendations.subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={requireAuth} style={[styles.profileButton, { backgroundColor: colors.card }]}>
            {user ? (
              <Image source={{ uri: user.avatar || 'https://picsum.photos/seed/user/200' }} style={styles.profileImage} />
            ) : (
              <Text style={styles.profileIcon}>🔑</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 {t('recommendations.trending')}</Text>
          <TouchableOpacity onPress={() => handleSeeAll('trending')}><Text style={[styles.seeAll, { color: colors.primary }]}>{t('recommendations.seeAll')}</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={[styles.featuredCard, { backgroundColor: colors.card }]}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.8}
            >
              <Image source={normalizeImage(event.image)} style={styles.featuredImage} resizeMode="cover" />
              <View style={styles.featuredOverlay}>
                <View style={styles.featuredBadge}>
                  <Text style={[styles.featuredBadgeText, { color: colors.warning }]}>★ {event.rating}</Text>
                </View>
              </View>
              <View style={styles.featuredContent}>
                <Text style={[styles.featuredTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.featuredInfo, { color: colors.textSecondary }]}>📅 {formatDate(event.date)} • 📍 {event.location.split(',')[0]}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📅 {t('recommendations.upcomingSoon')}</Text>
          <TouchableOpacity onPress={() => handleSeeAll('upcoming')}><Text style={[styles.seeAll, { color: colors.primary }]}>{t('recommendations.seeAll')}</Text></TouchableOpacity>
        </View>
        <View style={styles.upcomingList}>
          {upcomingEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={[styles.upcomingCard, { backgroundColor: colors.card }]}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.8}
            >
              <Image source={normalizeImage(event.image)} style={styles.upcomingImage} resizeMode="cover" />
              <View style={styles.upcomingContent}>
                <Text style={[styles.upcomingTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.upcomingDate, { color: colors.textSecondary }]}>📅 {formatDate(event.date)}</Text>
                <Text style={[styles.upcomingPrice, { color: colors.primary }]}>
                  {event.price === 0 ? t('eventDetails.free') : `K${event.price}`}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎉 {t('recommendations.freeEvents')}</Text>
          <TouchableOpacity onPress={() => handleSeeAll('free')}><Text style={[styles.seeAll, { color: colors.primary }]}>{t('recommendations.seeAll')}</Text></TouchableOpacity>
        </View>
        <View style={styles.freeGrid}>
          {freeEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={[styles.freeCard, { backgroundColor: colors.card }]}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.8}
            >
              <Image source={normalizeImage(event.image)} style={styles.freeImage} resizeMode="cover" />
              <View style={styles.freeContent}>
                <Text style={[styles.freeTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.freeDate, { color: colors.textSecondary }]}>{formatDate(event.date)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📌 {t('recommendations.pinned')}</Text>
        </View>
        <View style={styles.pinnedContainer}>
          {events.length > 0 && (() => {
            const highestRated = events.reduce((a, b) => a.rating > b.rating ? a : b);
            const mostAttendees = events.reduce((a, b) => a.attendees > b.attendees ? a : b);
            return (
              <>
                <TouchableOpacity style={[styles.pinnedCard, { backgroundColor: colors.card }]} onPress={() => handleEventPress(events[0])}>
                  <Text style={styles.pinnedIcon}>📌</Text>
                  <View style={styles.pinnedContent}>
                    <Text style={[styles.pinnedTitle, { color: colors.text }]}>{events[0].title}</Text>
                    <Text style={[styles.pinnedSubtitle, { color: colors.textSecondary }]}>{t('recommendations.firstListed')}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pinnedCard, { backgroundColor: colors.card }]} onPress={() => handleEventPress(highestRated)}>
                  <Text style={styles.pinnedIcon}>⭐</Text>
                  <View style={styles.pinnedContent}>
                    <Text style={[styles.pinnedTitle, { color: colors.text }]}>{highestRated.title}</Text>
                    <Text style={[styles.pinnedSubtitle, { color: colors.textSecondary }]}>{t('recommendations.highestRated')} ({highestRated.rating})</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pinnedCard, { backgroundColor: colors.card }]} onPress={() => handleEventPress(mostAttendees)}>
                  <Text style={styles.pinnedIcon}>👥</Text>
                  <View style={styles.pinnedContent}>
                    <Text style={[styles.pinnedTitle, { color: colors.text }]}>{mostAttendees.title}</Text>
                    <Text style={[styles.pinnedSubtitle, { color: colors.textSecondary }]}>{t('recommendations.mostAttendees')} ({mostAttendees.attendees})</Text>
                  </View>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#8b5cf6',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ddd6fe',
    marginTop: 2,
  },
  starIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIconText: {
    fontSize: 24,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 22,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuredCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 120,
  },
  featuredOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  featuredBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredContent: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredInfo: {
    fontSize: 12,
  },
  upcomingList: {
    gap: 8,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  upcomingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  upcomingContent: {
    flex: 1,
    marginLeft: 12,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  upcomingPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    marginLeft: 8,
  },
  freeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  freeCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  freeImage: {
    width: '100%',
    height: 80,
  },
  freeContent: {
    padding: 10,
  },
  freeTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  freeDate: {
    fontSize: 12,
  },
  pinnedContainer: {
    gap: 8,
  },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pinnedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pinnedContent: {
    flex: 1,
  },
  pinnedTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  pinnedSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
