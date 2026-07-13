import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { adminApi } from '../../api';
import ScreenHeader from '../ui/ScreenHeader';

interface TicketInfo {
  id: string;
  eventTitle: string;
  status: 'Confirmed' | 'Used' | 'Cancelled';
  attendeeName?: string;
  attendeeEmail?: string;
  seat?: string;
  date?: string;
  time?: string;
  location?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: '#DCFCE7', text: '#16A34A' },
  Used: { bg: '#F3F4F6', text: '#6B7280' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function VerifyScreen() {
  const { colors } = useTheme();
  const r = useResponsive();
  const { isMobile } = r;
  const px = horizontalPadding(r);

  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [markingUsed, setMarkingUsed] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  const lookupTicket = useCallback(async (id: string) => {
    if (!id.trim()) {
      Alert.alert('Error', 'Enter a ticket ID');
      return;
    }
    setLoading(true);
    setTicket(null);
    try {
      const data = await adminApi.lookupTicket(id.trim());
      setTicket(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ticket not found');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkUsed = useCallback(async () => {
    if (!ticket) return;
    Alert.alert('Mark as Used', `Mark ticket ${ticket.id.slice(0, 12)}... as used?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setMarkingUsed(true);
          try {
            await adminApi.markTicketUsed(ticket.id);
            setTicket((prev) => (prev ? { ...prev, status: 'Used' as const } : null));
            Alert.alert('Success', 'Ticket marked as used');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to mark ticket');
          } finally {
            setMarkingUsed(false);
          }
        },
      },
    ]);
  }, [ticket]);

  const startScanner = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Scanner', 'Camera scanning is only available on web');
      return;
    }
    try {
      const mod = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode;

      setScannerOpen(true);

      setTimeout(() => {
        const container = scannerContainerRef.current;
        if (!container) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        scanner
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string) => {
              setTicketId(decodedText);
              scanner.stop().catch(() => {});
              scanner.clear().catch(() => {});
              setScannerOpen(false);
              lookupTicket(decodedText);
            },
            () => {}
          )
          .catch((err: any) => {
            Alert.alert('Scanner Error', err.message || 'Failed to start camera');
            setScannerOpen(false);
          });
      }, 300);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load scanner');
      setScannerOpen(false);
    }
  }, [lookupTicket]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const getStatusStyle = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.Confirmed;

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const renderTicketInfo = () => {
    if (!ticket) return null;
    const st = getStatusStyle(ticket.status);

    return (
      <View
        style={[
          styles.ticketCard,
          {
            backgroundColor: colors.card || colors.surface || '#FFFFFF',
            borderColor: colors.border || '#E5E7EB',
            shadowColor: '#000',
          },
        ]}
      >
        <View style={styles.ticketHeader}>
          <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
            {ticket.eventTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>
              {getStatusLabel(ticket.status)}
            </Text>
          </View>
        </View>

        <View style={styles.ticketDetails}>
          {ticket.attendeeName && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
                Attendee
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {ticket.attendeeName}
              </Text>
            </View>
          )}
          {ticket.attendeeEmail && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
                Email
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {ticket.attendeeEmail}
              </Text>
            </View>
          )}
          {ticket.seat && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
                Seat
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {ticket.seat}
              </Text>
            </View>
          )}
          {ticket.date && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {ticket.date}
              </Text>
            </View>
          )}
          {ticket.time && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
                Time
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {ticket.time}
              </Text>
            </View>
          )}
          {ticket.location && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
                Location
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {ticket.location}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary || colors.text }]}>
              Ticket ID
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontFamily: 'monospace' }]}>
              {ticket.id}
            </Text>
          </View>
        </View>

        {ticket.status === 'Confirmed' && (
          <TouchableOpacity
            style={[styles.markUsedBtn, markingUsed && styles.disabledBtn]}
            onPress={handleMarkUsed}
            disabled={markingUsed}
          >
            {markingUsed ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.markUsedBtnText}>Mark as Used</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderScanner = () => {
    if (!scannerOpen) return null;
    return (
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerWrapper}>
          <div
            id="qr-reader"
            ref={scannerContainerRef}
            style={{ width: '100%', minHeight: 300 }}
          />
          <TouchableOpacity style={styles.scannerCloseBtn} onPress={stopScanner}>
            <Text style={styles.scannerCloseText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Verify Ticket" />

      <View
        style={[
          styles.content,
          isMobile ? styles.contentMobile : styles.contentDesktop,
          { paddingHorizontal: px },
        ]}
      >
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={[styles.cameraBtn, { backgroundColor: colors.primary || '#6366F1' }]}
            onPress={startScanner}
          >
            <Text style={styles.cameraBtnText}>Open Camera Scanner</Text>
          </TouchableOpacity>
        )}

        <View style={styles.manualSection}>
          <Text style={[styles.label, { color: colors.text }]}>Ticket ID</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface || '#F9FAFB',
                  color: colors.text,
                  borderColor: colors.border || '#E5E7EB',
                },
              ]}
              placeholder="Enter ticket ID"
              placeholderTextColor={colors.textSecondary || '#9CA3AF'}
              value={ticketId}
              onChangeText={setTicketId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.lookupBtn, { backgroundColor: colors.primary || '#6366F1' }]}
              onPress={() => lookupTicket(ticketId)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.lookupBtnText}>Lookup</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {renderTicketInfo()}
        {renderScanner()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  contentMobile: {
    paddingHorizontal: 0,
  },
  contentDesktop: {
    alignItems: 'center',
  },
  cameraBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  manualSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  lookupBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ticketCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
    maxWidth: 600,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ticketDetails: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  markUsedBtn: {
    marginTop: 18,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  markUsedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 20,
  },
  scannerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  scannerCloseBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  scannerCloseText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
