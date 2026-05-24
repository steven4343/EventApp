import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Event } from '../../types';
import { Badge } from '../ui/Badge';
import { normalizeImage } from '../../utils/image';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const categoryColors: Record<string, 'default' | 'success' | 'warning'> = {
  Social: 'default',
  Cultural: 'default',
  Sports: 'success',
  Academic: 'warning',
  Entertainment: 'default',
  Partnership: 'default',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={normalizeImage(event.image)} style={styles.image} resizeMode="contain" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Badge variant={categoryColors[event.category] || 'default'}>
            {event.category}
          </Badge>
          <Text style={styles.date}>{formatDate(event.date)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>★ {event.rating}</Text>
            <Text style={styles.reviews}>({event.reviews})</Text>
          </View>
          <Text style={styles.price}>
            {event.price === 0 ? 'Free' : `K${event.price}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '47%',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: '#64748b',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviews: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
});
