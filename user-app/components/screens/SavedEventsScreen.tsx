import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { userApi } from '../../api';
import { Event } from '../../types';

interface SavedEventRaw {
  id: string;
  userId: string;
  eventId: string;
  savedAt: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  image?: string;
  price?: number;
  category?: string;
  description?: string;
}

export function SavedEventsScreen() {
  const navigation = useNavigation<any>();
  const [savedEvents, setSavedEvents] = useState<SavedEventRaw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedEvents();
  }, []);

  const loadSavedEvents = async () => {
    try {
      const data = await userApi.getSavedEvents();
      setSavedEvents(data);
    } catch (e) {
      console.error('Failed to load saved events:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleUnsave = async (savedEventId: string) => {
    try {
      await userApi.unsaveEvent(savedEventId);
      setSavedEvents((prev) => prev.filter((se) => se.eventId !== savedEventId));
    } catch (e) {
      console.error('Failed to unsave event:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (savedEvents.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Saved Events</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>No saved events</Text>
            <Text style={styles.emptyText}>Save events you're interested in and they will show up here.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Events</Text>
        </View>

        <View style={styles.list}>
          {savedEvents.map((saved) => {
            return (
              <TouchableOpacity
                key={saved.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('EventsTab', { screen: 'EventDetails', params: { eventId: saved.eventId } })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: saved.image || 'https://picsum.photos/seed/event/400' }} style={styles.eventImage} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{saved.title || 'Unknown Event'}</Text>
                  <Text style={styles.eventDate}>📅 {saved.date ? formatDate(saved.date) : 'TBA'}</Text>
                  <View style={styles.eventFooter}>
                    <Text style={styles.eventPrice}>{!saved.price || saved.price === 0 ? 'Free' : `K${saved.price}`}</Text>
                    <TouchableOpacity onPress={() => handleUnsave(saved.eventId)} style={styles.unsaveButton}>
                      <Text style={styles.unsaveText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  eventDate: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  unsaveButton: {
    padding: 4,
  },
  unsaveText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
});
