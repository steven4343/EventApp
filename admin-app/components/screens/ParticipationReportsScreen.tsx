import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api';

interface EventReport {
  id: string;
  title: string;
  date: string;
  status: string;
  category: string;
  registeredCount: number;
  maxCapacity: number;
  avgRating: number;
  reviewCount: number;
}

interface Participant {
  id: string;
  user_id: string;
  event_id: string;
  seat: string;
  status: string;
  price: number;
  purchased_at: string;
  name: string;
  email: string;
  student_id: string;
  faculty: string;
  year: number;
}

export default function ParticipationReportsScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState<EventReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventReport | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [detailStats, setDetailStats] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadReport = async () => {
    try {
      const data = await adminApi.getEventReport();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load report:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const openDetail = async (event: EventReport) => {
    setSelectedEvent(event);
    setDetailModalVisible(true);
    setLoadingDetail(true);
    try {
      const data = await adminApi.getEventParticipants(event.id);
      setParticipants(data.participants || []);
      setDetailStats(data.stats || null);
    } catch (e) {
      console.error('Failed to load participants:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return '#22c55e';
      case 'Pending': return '#f59e0b';
      case 'Draft': return '#94a3b8';
      default: return colors.textSecondary;
    }
  };

  const renderEvent = ({ item }: { item: EventReport }) => (
    <TouchableOpacity
      onPress={() => openDetail(item)}
      style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={2}>{item.title}</Text>
        <View style={{ backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: getStatusColor(item.status) }}>{item.status}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{item.date} · {item.category}</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>Registered: {item.registeredCount}{item.maxCapacity ? `/${item.maxCapacity}` : ''}</Text>
        {item.avgRating > 0 && <Text style={{ fontSize: 12, color: colors.textMuted }}>Rating: {item.avgRating.toFixed(1)} ({item.reviewCount})</Text>}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <View style={{ flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: item.maxCapacity ? `${Math.min(100, (item.registeredCount / item.maxCapacity) * 100)}%` : '0%', backgroundColor: colors.primary, borderRadius: 3 }} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Participation Reports</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {events.length} events · {events.reduce((sum, e) => sum + e.registeredCount, 0)} total registrations
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }}>No events yet</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReport(); }} tintColor={colors.primary} />}
        />
      )}

      <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 100, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>{selectedEvent?.title || ''}</Text>
              <TouchableOpacity onPress={() => { setDetailModalVisible(false); setParticipants([]); }} style={{ padding: 8 }}>
                <Text style={{ fontSize: 22, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            {detailStats && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{detailStats.totalRegistered}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Registered</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#22c55e' }}>{detailStats.totalReviews}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Reviews</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#f59e0b' }}>{detailStats.averageRating?.toFixed(1) || '0.0'}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Avg Rating</Text>
                </View>
              </View>
            )}

            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Participants ({participants.length})</Text>

            {loadingDetail ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : participants.length === 0 ? (
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No registrations yet.</Text>
            ) : (
              <FlatList
                data={participants}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.email}</Text>
                    {item.student_id ? <Text style={{ fontSize: 11, color: colors.textMuted }}>ID: {item.student_id}</Text> : null}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
