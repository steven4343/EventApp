import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { userApi } from '../../api';

interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  seat: string;
  status: 'Confirmed' | 'Used' | 'Cancelled';
  price: number;
  purchasedAt: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: any;
  price: number;
}

interface TicketWithEvent {
  id: string;
  userId: string;
  eventId: string;
  seat: string;
  status: 'Confirmed' | 'Used' | 'Cancelled';
  price: number;
  purchasedAt: string;
  event?: Event;
}

export function MyTicketsScreen() {
  const navigation = useNavigation();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await userApi.getTickets();
      const ticketsWithEvents: TicketWithEvent[] = [];
      for (const ticket of data) {
        const event = await userApi.getEventById(ticket.eventId);
        ticketsWithEvents.push({ ...ticket, event: event || undefined });
      }
      setTickets(ticketsWithEvents);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return { bg: '#dcfce7', text: '#166534' };
      case 'Used': return { bg: '#f1f5f9', text: '#64748b' };
      case 'Cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Tickets</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptyText}>When you purchase tickets, they will appear here.</Text>
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
          <Text style={styles.headerTitle}>My Tickets</Text>
        </View>

        <View style={styles.list}>
          {tickets.map((ticket) => {
            const statusColors = getStatusColor(ticket.status);
            return (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.eventName}>{ticket.event?.title || 'Unknown Event'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>{ticket.status}</Text>
                  </View>
                </View>
                <View style={styles.ticketDetails}>
                  <Text style={styles.detailText}>📅 {ticket.event?.date ? formatDate(ticket.event.date) : 'TBA'}</Text>
                  <Text style={styles.detailText}>📍 {ticket.event?.location || 'TBA'}</Text>
                  <Text style={styles.detailText}>💺 Seat: {ticket.seat}</Text>
                  <Text style={styles.detailText}>🎫 {ticket.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                {ticket.status === 'Confirmed' && (
                  <View style={styles.qrPlaceholder}>
                    <Text style={{ fontSize: 48 }}>📱</Text>
                    <Text style={styles.qrText}>QR Code</Text>
                  </View>
                )}
              </View>
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
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  qrText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
});
