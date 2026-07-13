import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { adminApi } from '../../api';
import ScreenHeader from '../ui/ScreenHeader';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';

type PaymentStatus = 'all' | 'pending' | 'verified' | 'rejected';

interface Payment {
  ticketId: string;
  amount: number;
  method: string;
  status: 'pending' | 'verified' | 'rejected';
  userName?: string;
  userEmail?: string;
  eventTitle?: string;
  createdAt?: string;
}

const FILTERS: { key: PaymentStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  verified: { bg: '#DCFCE7', text: '#16A34A' },
  pending: { bg: '#FEF9C3', text: '#CA8A04' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

interface PaymentsManagementScreenProps {
  refreshKey?: number;
}

export default function PaymentsManagementScreen({ refreshKey }: PaymentsManagementScreenProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const { isMobile, isTablet } = r;
  const px = horizontalPadding(r);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PaymentStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const data = await adminApi.getPayments(status);
      setPayments(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchPayments();
    }
  }, [refreshKey]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async (ticketId: string) => {
    Alert.alert('Verify Payment', `Verify payment for ticket ${ticketId.slice(0, 8)}...?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        style: 'default',
        onPress: async () => {
          try {
            setProcessingId(ticketId);
            const admin = await adminApi.getCurrentAdmin();
            await adminApi.verifyPayment(ticketId, admin.id);
            setPayments((prev) =>
              prev.map((p) => (p.ticketId === ticketId ? { ...p, status: 'verified' as const } : p))
            );
            Alert.alert('Success', 'Payment verified');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to verify payment');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (ticketId: string) => {
    Alert.alert('Reject Payment', `Reject payment for ticket ${ticketId.slice(0, 8)}...?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingId(ticketId);
            const admin = await adminApi.getCurrentAdmin();
            await adminApi.rejectPayment(ticketId, admin.id);
            setPayments((prev) =>
              prev.map((p) => (p.ticketId === ticketId ? { ...p, status: 'rejected' as const } : p))
            );
            Alert.alert('Rejected', 'Payment rejected');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject payment');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const getStatusStyle = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.pending;

  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  const renderPaymentCard = (payment: Payment) => {
    const st = getStatusStyle(payment.status);
    const isProcessing = processingId === payment.ticketId;
    const cardWidth = isMobile
      ? '100%'
      : `${100 / getGridColumns() - 2}%`;

    return (
      <View
        key={payment.ticketId}
        style={[
          styles.card,
          {
            backgroundColor: colors.card || colors.surface || '#FFFFFF',
            width: cardWidth,
            borderColor: colors.border || '#E5E7EB',
            shadowColor: '#000',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.ticketId, { color: colors.text }]} numberOfLines={1}>
            {payment.ticketId.length > 12
              ? payment.ticketId.slice(0, 12) + '...'
              : payment.ticketId}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.amount, { color: colors.text }]}>
            ${payment.amount.toFixed(2)}
          </Text>
          <Text style={[styles.method, { color: colors.textSecondary || colors.text }]}>
            {payment.method}
          </Text>

          {payment.userName && (
            <Text style={[styles.userInfo, { color: colors.textSecondary || colors.text }]}>
              {payment.userName}
            </Text>
          )}
          {payment.userEmail && (
            <Text style={[styles.userEmail, { color: colors.textSecondary || colors.text }]}>
              {payment.userEmail}
            </Text>
          )}
        </View>

        {payment.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.verifyBtn, isProcessing && styles.disabledBtn]}
              onPress={() => handleVerify(payment.ticketId)}
              disabled={isProcessing}
            >
              <Text style={styles.verifyBtnText}>
                {isProcessing ? '...' : 'Verify'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn, isProcessing && styles.disabledBtn]}
              onPress={() => handleReject(payment.ticketId)}
              disabled={isProcessing}
            >
              <Text style={styles.rejectBtnText}>
                {isProcessing ? '...' : 'Reject'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton count={6} />;
    }

    if (payments.length === 0) {
      return <EmptyState message="No payments found" />;
    }

    const columns = getGridColumns();

    return (
      <View style={[styles.grid, columns > 1 && styles.gridMulti]}>
        {payments.map((payment) => renderPaymentCard(payment))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Payments" />

      <View style={[styles.filterBar, { paddingHorizontal: px }]}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? (colors.primary || '#6366F1') : (colors.surface || '#F3F4F6'),
                  borderColor: isActive ? (colors.primary || '#6366F1') : (colors.border || '#E5E7EB'),
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#FFFFFF' : (colors.text || '#374151') },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: px },
          Platform.OS === 'web' && styles.scrollContentWeb,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  scrollContentWeb: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  gridMulti: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
    ...(Platform.OS === 'web'
      ? { transition: 'transform 0.2s', cursor: 'pointer' as any }
      : {}),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    gap: 4,
    marginBottom: 12,
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
  },
  method: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  userInfo: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyBtn: {
    backgroundColor: '#DCFCE7',
  },
  verifyBtnText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
