import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../theme/responsive';
import { adminApi } from '../../api';

interface PendingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface Props {
  onDataChange?: () => void;
  notifTrigger?: number;
}

export default function PendingEventsScreen({ onDataChange, notifTrigger }: Props) {
  const { colors } = useTheme();
  const r = useResponsive();
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await adminApi.getPendingEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load pending events:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [notifTrigger]);

  const handleApprove = async (eventId: string, title: string) => {
    Alert.alert('Approve Event', `Approve "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setActionLoading(true);
          try {
            await adminApi.approveEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            onDataChange?.();
            Alert.alert('Approved', 'Event has been published.');
          } catch (e) {
            Alert.alert('Error', 'Failed to approve event.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const openRejectModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.rejectEvent(selectedEventId, rejectReason.trim());
      setEvents(prev => prev.filter(e => e.id !== selectedEventId));
      setRejectModalVisible(false);
      onDataChange?.();
      Alert.alert('Rejected', 'Event has been rejected.');
    } catch (e) {
      Alert.alert('Error', 'Failed to reject event.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderEvent = ({ item }: { item: PendingEvent }) => (
    <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={2}>{item.title}</Text>
        <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#d97706' }}>PENDING</Text>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
        {item.date} {item.time ? `· ${item.time}` : ''}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{item.location}</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>Category: {item.category}</Text>

      {item.description ? (
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }} numberOfLines={3}>{item.description}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => handleApprove(item.id, item.title)}
          disabled={actionLoading}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#22c55e', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openRejectModal(item.id)}
          disabled={actionLoading}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Pending Approvals</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {events.length} event{events.length !== 1 ? 's' : ''} awaiting review
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }}>All caught up!</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>No pending events to review.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvents(); }} tintColor={colors.primary} />}
        />
      )}

      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Reject Event</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>Please provide a reason for rejection:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: colors.background, color: colors.text, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Rejection reason..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReject}
                disabled={actionLoading}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{actionLoading ? 'Rejecting...' : 'Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
