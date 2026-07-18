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
  price: number;
  rejectionReason?: string;
  image?: any;
  createdAt: string;
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

  const filters = ['All', 'Pending', 'Published', 'Rejected', 'Draft'];

  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === 'Pending').length,
    published: events.filter(e => e.status === 'Published').length,
    rejected: events.filter(e => e.status === 'Rejected').length,
    totalAttendees: events.reduce((sum, e) => sum + (e.attendees || 0), 0),
  };

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
        {item.date} {item.time ? `\u00B7 ${item.time}` : ''} \u00B7 {item.location}
      </Text>

      {item.status === 'Rejected' && item.rejectionReason ? (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#ef4444' }}>
          <Text style={[typography.caption, { color: '#dc2626', fontWeight: '600' }]}>Admin feedback:</Text>
          <Text style={[typography.bodySmall, { color: '#991b1b', marginTop: 2 }]}>{item.rejectionReason}</Text>
        </View>
      ) : null}

      {item.status === 'Pending' && (
        <View style={{ backgroundColor: '#fffbeb', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#f59e0b' }}>
          <Text style={[typography.caption, { color: '#b45309', fontWeight: '600' }]}>Awaiting admin review</Text>
          <Text style={[typography.bodySmall, { color: '#92400e', marginTop: 2 }]}>
            Submitted {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'recently'}. You will be notified once a decision is made.
          </Text>
        </View>
      )}

      {item.status === 'Published' && (
        <View style={{ backgroundColor: '#f0fdf4', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#22c55e' }}>
          <Text style={[typography.caption, { color: '#15803d', fontWeight: '600' }]}>Live & accepting registrations</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <View>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>Registrations</Text>
            <Text style={[typography.label, { color: colors.text }]}>{item.attendees}{item.maxCapacity ? `/${item.maxCapacity}` : ''}</Text>
          </View>
          {item.maxCapacity > 0 && (
            <View>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>Capacity</Text>
              <Text style={[typography.label, { color: colors.text }]}>{Math.round((item.attendees / item.maxCapacity) * 100)}%</Text>
            </View>
          )}
          <View>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>Price</Text>
            <Text style={[typography.label, { color: colors.text }]}>{item.price > 0 ? `ZMW ${item.price}` : 'Free'}</Text>
          </View>
        </View>
        {item.status === 'Published' && item.reviews > 0 && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>Rating</Text>
            <Text style={[typography.label, { color: '#f59e0b' }]}>{"\u2605"} {item.rating?.toFixed(1)} ({item.reviews})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md, padding: spacing.xs }}>
          <Text style={{ fontSize: 24, color: colors.text }}>&#8592;</Text>
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>My Events</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm }}>
        {[
          { label: 'Total', value: stats.total, color: colors.text },
          { label: 'Pending', value: stats.pending, color: '#f59e0b' },
          { label: 'Live', value: stats.published, color: '#22c55e' },
          { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
        ].map((stat) => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={[typography.h3, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {stats.totalAttendees > 0 && (
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Total registrations across all events: <Text style={{ fontWeight: '700', color: colors.text }}>{stats.totalAttendees}</Text>
            </Text>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: filter === f ? colors.primary : colors.card, borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border }}
          >
            <Text style={{ color: filter === f ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{f}</Text>
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
            {filter === 'All' ? "You haven't created any events yet. Tap 'Create' to submit your first event." : `No ${filter.toLowerCase()} events.`}
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
