import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Event } from '../../types';
import { userApi } from '../../api';

import { useAuth } from '../../context/AuthContext';

export function RecommendationsScreen({ requireAuth }: { requireAuth?: () => void }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
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
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Recommendations</Text>
            <Text style={styles.headerSubtitle}>Events you might like</Text>
          </View>
          <TouchableOpacity onPress={requireAuth} style={styles.profileButton}>
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
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          <TouchableOpacity onPress={() => handleSeeAll('trending')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.featuredCard}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.8}
            >
              <Image source={event.image} style={styles.featuredImage} resizeMode="cover" />
              <View style={styles.featuredOverlay}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>★ {event.rating}</Text>
                </View>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.featuredInfo}>📅 {formatDate(event.date)} • 📍 {event.location.split(',')[0]}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Upcoming Soon</Text>
          <TouchableOpacity onPress={() => handleSeeAll('upcoming')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        <View style={styles.upcomingList}>
          {upcomingEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.upcomingCard}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.8}
            >
              <Image source={event.image} style={styles.upcomingImage} resizeMode="cover" />
              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.upcomingDate}>📅 {formatDate(event.date)}</Text>
                <Text style={styles.upcomingPrice}>
                  {event.price === 0 ? 'Free' : `K${event.price}`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎉 Free Events</Text>
          <TouchableOpacity onPress={() => handleSeeAll('free')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        <View style={styles.freeGrid}>
          {freeEvents.map(event => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.freeCard}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.8}
            >
              <Image source={event.image} style={styles.freeImage} resizeMode="cover" />
              <View style={styles.freeContent}>
                <Text style={styles.freeTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.freeDate}>{formatDate(event.date)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📌 Pinned by Students</Text>
        </View>
        <View style={styles.pinnedContainer}>
          {events.length > 0 && (() => {
            const highestRated = events.reduce((a, b) => a.rating > b.rating ? a : b);
            const mostAttendees = events.reduce((a, b) => a.attendees > b.attendees ? a : b);
            return (
              <>
                <TouchableOpacity style={styles.pinnedCard} onPress={() => handleEventPress(events[0])}>
                  <Text style={styles.pinnedIcon}>📌</Text>
                  <View style={styles.pinnedContent}>
                    <Text style={styles.pinnedTitle}>{events[0].title}</Text>
                    <Text style={styles.pinnedSubtitle}>First listed event</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pinnedCard} onPress={() => handleEventPress(highestRated)}>
                  <Text style={styles.pinnedIcon}>⭐</Text>
                  <View style={styles.pinnedContent}>
                    <Text style={styles.pinnedTitle}>{highestRated.title}</Text>
                    <Text style={styles.pinnedSubtitle}>Highest rated ({highestRated.rating})</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pinnedCard} onPress={() => handleEventPress(mostAttendees)}>
                  <Text style={styles.pinnedIcon}>👥</Text>
                  <View style={styles.pinnedContent}>
                    <Text style={styles.pinnedTitle}>{mostAttendees.title}</Text>
                    <Text style={styles.pinnedSubtitle}>Most attendees ({mostAttendees.attendees})</Text>
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
    backgroundColor: '#f8fafc',
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
    color: '#1e293b',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  featuredCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    color: '#d97706',
  },
  featuredContent: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featuredInfo: {
    fontSize: 12,
    color: '#64748b',
  },
  upcomingList: {
    gap: 8,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#1e293b',
    marginBottom: 4,
  },
  upcomingDate: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  upcomingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  chevron: {
    fontSize: 24,
    color: '#cbd5e1',
    marginLeft: 8,
  },
  freeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  freeCard: {
    width: '48%',
    backgroundColor: '#fff',
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
    color: '#1e293b',
    marginBottom: 4,
  },
  freeDate: {
    fontSize: 12,
    color: '#64748b',
  },
  pinnedContainer: {
    gap: 8,
  },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#1e293b',
  },
  pinnedSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
