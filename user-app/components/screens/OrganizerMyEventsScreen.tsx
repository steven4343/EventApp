import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { userApi } from '../../api';
import { useFocusEffect } from '@react-navigation/native';

interface OrganizerEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  status: string;
  attendees: number;
  maxCapacity: number;
  rating: number;
  reviews: number;
  rejectionReason?: string;
  image?: any;
}

interface OrganizerMyEventsScreenProps {
  navigation: any;
}

export function OrganizerMyEventsScreen({ navigation }: OrganizerMyEventsScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const loadEvents = async () => {
    try {
      const data = await userApi.getOrganizerEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load organizer events:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return '#22c55e';
      case 'Pending': return '#f59e0b';
      case 'Rejected': return '#ef4444';
      case 'Draft': return '#94a3b8';
      case 'Cancelled': return '#6b7280';
      default: return colors.textSecondary;
    }
  };

  const filteredEvents = filter === 'All' ? events : events.filter(e => e.status === filter);

  const filters = ['All', 'Pending', 'Published', 'Rejected'];

  const renderEvent = ({ item }: { item: OrganizerEvent }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
      style={[shadow.sm, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <Text style={[typography.h4, { color: colors.text, flex: 1, marginRight: spacing.sm }]} numberOfLines={2}>{item.title}</Text>
        <View style={{ backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: getStatusColor(item.status), textTransform: 'uppercase' }}>{item.status}</Text>
        </View>
      </View>

      <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
        {item.date} {item.time ? `· ${item.time}` : ''} · {item.location}
      </Text>

      {item.status === 'Rejected' && item.rejectionReason ? (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#ef4444' }}>
          <Text style={[typography.caption, { color: '#dc2626', fontWeight: '600' }]}>Rejection reason:</Text>
          <Text style={[typography.bodySmall, { color: '#991b1b', marginTop: 2 }]}>{item.rejectionReason}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Registered: {item.attendees}{item.maxCapacity ? `/${item.maxCapacity}` : ''}</Text>
        {item.reviews > 0 && (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Rating: {item.rating?.toFixed(1)} ({item.reviews})</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md, padding: spacing.xs }}>
          <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>My Events</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm }}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: filter === f ? colors.primary : colors.card, borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border }}
          >
            <Text style={{ color: filter === f ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl }}>
          <Text style={[typography.h3, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }]}>No events found</Text>
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
            {filter === 'All' ? "You haven't created any events yet." : `No ${filter.toLowerCase()} events.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}
