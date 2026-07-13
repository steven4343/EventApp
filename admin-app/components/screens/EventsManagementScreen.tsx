import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  RefreshControl,
  Pressable,
  Image,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { adminApi } from '../../api';
import { ScreenHeader } from '../ui/ScreenHeader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';
import NotificationDropdown from '../NotificationDropdown';
import CreateEventModal from './CreateEventModal';

const CATEGORIES = ['', 'Music Concert', 'Conference', 'Sports', 'Church Event', 'Community', 'Workshop'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Published: { bg: 'rgba(34, 197, 94, 0.12)', text: '#16a34a' },
  Draft: { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706' },
  Cancelled: { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626' },
};

const STATUS_COLORS_DARK: Record<string, { bg: string; text: string }> = {
  Published: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' },
  Draft: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  Cancelled: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' },
};

const CATEGORY_ICONS: Record<string, string> = {
  '': '📅',
  'Music Concert': '🎵',
  'Conference': '🎤',
  'Sports': '⚽',
  'Church Event': '⛪',
  'Community': '🤝',
  'Workshop': '🛠️',
};

interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  location: string;
  status: 'Published' | 'Draft' | 'Cancelled';
  rating: number;
  reviewCount: number;
  attendeeCount: number;
  imageUrl?: string;
  description?: string;
  price?: number;
  maxCapacity?: number;
  clubId?: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface FeedbackData {
  eventId: string;
  eventTitle: string;
  averageRating: number;
  totalReviews: number;
  distribution: number[];
  reviews: Review[];
}

interface EventsManagementScreenProps {
  navigation?: any;
  onDataChange?: () => void;
  notifTrigger?: number;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: size, color: star <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function EventsManagementScreen({ navigation, onDataChange, notifTrigger }: EventsManagementScreenProps) {
  const { colors, isDark } = useTheme();
  const r = useResponsive();
  const px = horizontalPadding(r);
  const statusColors = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackData | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getColumns = (): number => {
    if (r.isWideDesktop) return 3;
    if (r.isDesktop) return 3;
    if (r.isTablet) return 2;
    return 1;
  };

  const columns = getColumns();

  const fetchEvents = useCallback(async () => {
    try {
      const statusFilter = selectedStatus || undefined;
      const categoryFilter = selectedCategory || undefined;
      const data = await adminApi.getEvents(statusFilter, categoryFilter);
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, [fetchEvents]);

  const handlePublishToggle = async (event: Event) => {
    const isPublished = event.status === 'Published';
    const actionLabel = isPublished ? 'Unpublish' : 'Publish';

    if (Platform.OS === 'web') {
      if (!confirm(`Are you sure you want to ${actionLabel} "${event.title}"?`)) return;
    } else {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(`${actionLabel} Event`, `Are you sure you want to ${actionLabel} "${event.title}"?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: actionLabel, onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    setActionLoading(event.id);
    try {
      if (isPublished) {
        await adminApi.unpublishEvent(event.id);
      } else {
        await adminApi.publishEvent(event.id);
      }
      await fetchEvents();
      onDataChange?.();
    } catch (error) {
      Alert.alert('Error', `Failed to ${actionLabel.toLowerCase()} event.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (event: Event) => {
    if (Platform.OS === 'web') {
      if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    } else {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert('Delete Event', `Are you sure you want to delete "${event.title}"? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    setActionLoading(event.id);
    try {
      await adminApi.deleteEvent(event.id);
      await fetchEvents();
      onDataChange?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete event.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenFeedback = async (event: Event) => {
    setFeedbackLoading(true);
    try {
      const data = await adminApi.getEventReviews(event.id);
      const stats = data.stats || {};
      const reviews = data.reviews || [];
      const distribution = [0, 0, 0, 0, 0];
      if (Array.isArray(stats.ratingDistribution)) {
        stats.ratingDistribution.forEach((d: any) => {
          if (d.stars >= 1 && d.stars <= 5) distribution[d.stars - 1] = d.count;
        });
      }
      setFeedbackModal({
        eventId: event.id,
        eventTitle: event.title,
        averageRating: stats.averageRating || 0,
        totalReviews: stats.totalReviews || 0,
        distribution,
        reviews,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (selectedCategory && event.category !== selectedCategory) return false;
    if (selectedStatus && event.status !== selectedStatus) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderEventCard = (event: Event) => {
    const badge = statusColors[event.status] || statusColors.Draft;
    const isBusy = actionLoading === event.id;

    return (
      <Pressable
        key={event.id}
        style={({ hovered }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
            borderColor: colors.border,
            opacity: isBusy ? 0.6 : 1,
            ...(hovered && Platform.OS === 'web'
              ? {
                  transform: [{ translateY: -3 }],
                  shadowColor: colors.primary,
                  shadowOpacity: 0.2,
                }
              : {}),
          },
        ]}
      >
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.surface }]}>
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[event.category] || '📅'}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {event.status}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Date</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                📅 {formatDate(event.date)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                {CATEGORY_ICONS[event.category] || '📅'} {event.category || 'Uncategorized'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Location</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]} numberOfLines={1}>
                📍 {event.location}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Rating</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <StarRating rating={event.rating} size={13} />
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {event.rating > 0 ? event.rating.toFixed(1) : 'N/A'} ({event.reviewCount || 0})
                </Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Attendees</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                👥 {event.attendeeCount || 0}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: event.status === 'Published' ? colors.warning : colors.success }]}
              onPress={() => handlePublishToggle(event)}
              disabled={isBusy}
            >
              <Text style={styles.actionBtnText}>
                {isBusy ? '...' : event.status === 'Published' ? 'Unpublish' : 'Publish'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleOpenFeedback(event)}
              disabled={feedbackLoading || isBusy}
            >
              <Text style={styles.actionBtnText}>
                {feedbackLoading ? '...' : 'Feedback'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.deleteBtn, { borderColor: colors.danger }]}
              onPress={() => handleDelete(event)}
              disabled={isBusy}
            >
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderFeedbackModal = () => {
    if (!feedbackModal) return null;

    const maxDist = Math.max(...feedbackModal.distribution, 1);

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.feedbackModal, { backgroundColor: colors.card }]}>
          <View style={styles.feedbackHeader}>
            <Text style={[styles.feedbackTitle, { color: colors.text }]}>
              Feedback: {feedbackModal.eventTitle}
            </Text>
            <TouchableOpacity onPress={() => setFeedbackModal(null)}>
              <Text style={[styles.closeBtn, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feedbackSummary}>
            <Text style={[styles.bigRating, { color: colors.text }]}>
              {feedbackModal.averageRating.toFixed(1)}
            </Text>
            <StarRating rating={feedbackModal.averageRating} size={20} />
            <Text style={[styles.totalReviews, { color: colors.textSecondary }]}>
              {feedbackModal.totalReviews} reviews
            </Text>
          </View>

          <View style={styles.distributionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rating Distribution</Text>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = feedbackModal.distribution[star - 1] || 0;
              const percentage = maxDist > 0 ? (count / maxDist) * 100 : 0;
              return (
                <View key={star} style={styles.distributionRow}>
                  <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{star}★</Text>
                  <View style={[styles.distBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.distBarFill, { width: `${percentage}%`, backgroundColor: '#f59e0b' }]} />
                  </View>
                  <Text style={[styles.distCount, { color: colors.textMuted }]}>{count}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Individual Reviews</Text>
            {feedbackModal.reviews.length === 0 ? (
              <Text style={[styles.noReviews, { color: colors.textMuted }]}>No reviews yet.</Text>
            ) : (
              <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
                {feedbackModal.reviews.map((review) => (
                  <View key={review.id} style={[styles.reviewCard, { borderColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>{review.userName}</Text>
                      <StarRating rating={review.rating} size={12} />
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                    <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{formatDate(review.createdAt)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    );
  };

  const PlusButton = () => (
    <Pressable
      style={({ hovered }) => [
        styles.plusBtn,
        hovered && Platform.OS === 'web' && { opacity: 0.85 },
      ]}
      onPress={() => setShowCreateModal(true)}
    >
      <Text style={styles.plusBtnText}>+ New</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
        <NotificationDropdown refreshTrigger={notifTrigger} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.contentContainer,
          (r.isDesktop || r.isWideDesktop) && styles.centeredContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={[
            styles.inner,
            { paddingHorizontal: px },
            (r.isDesktop || r.isWideDesktop) && styles.maxWidth,
          ]}
        >
          <ScreenHeader
            title="Events Management"
            subtitle={`${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} total`}
            action={<PlusButton />}
          />

          <View style={[styles.filterBar, { backgroundColor: colors.card }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, { backgroundColor: selectedCategory === cat ? colors.primary : colors.surface }]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.filterChipText, { color: selectedCategory === cat ? '#ffffff' : colors.textSecondary }]}>
                    {cat || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.statusBar, { backgroundColor: colors.card }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusBarContent}>
              {['', 'Published', 'Draft', 'Cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusChip, { backgroundColor: selectedStatus === status ? colors.primary : colors.surface }]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text style={[styles.statusChipText, { color: selectedStatus === status ? '#ffffff' : colors.textSecondary }]}>
                    {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Status'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={[styles.grid, { gap: 16 }]}>
                {Array.from({ length: columns * 2 }).map((_, i) => (
                  <View key={i} style={{ width: r.isMobile ? '100%' : `${100 / columns - (16 * (columns - 1)) / columns}%` }}>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
                      <LoadingSkeleton width="100%" height={140} borderRadius={0} />
                      <View style={{ padding: 16 }}>
                        <LoadingSkeleton width="70%" height={20} borderRadius={6} />
                        <View style={{ height: 8 }} />
                        <LoadingSkeleton width="40%" height={14} borderRadius={4} />
                        <View style={{ height: 8 }} />
                        <LoadingSkeleton width="100%" height={14} borderRadius={4} />
                        <LoadingSkeleton width="80%" height={14} borderRadius={4} />
                        <View style={{ height: 12 }} />
                        <LoadingSkeleton width="100%" height={36} borderRadius={10} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : filteredEvents.length === 0 ? (
              <EmptyState icon="📅" title="No Events Found" message="Create your first event or adjust your filters." />
            ) : (
              <View style={[styles.grid, { gap: 16 }]}>
                {filteredEvents.map((event) => (
                  <View key={event.id} style={{ width: r.isMobile ? '100%' : `${100 / columns - (16 * (columns - 1)) / columns}%` }}>
                    {renderEventCard(event)}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {renderFeedbackModal()}

      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchEvents();
          onDataChange?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centeredContent: {
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
  maxWidth: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  content: {
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterBar: {
    maxHeight: 60,
    marginTop: 16,
  },
  filterBarContent: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBar: {
    maxHeight: 50,
  },
  statusBarContent: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer' as any,
          transitionProperty: 'transform, shadow-opacity',
          transitionDuration: '200ms',
        }
      : {}),
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 36,
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 0.6,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  plusBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  plusBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackModal: {
    width: '90%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    fontSize: 22,
    paddingHorizontal: 8,
  },
  feedbackSummary: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  bigRating: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    marginTop: 6,
  },
  distributionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distLabel: {
    width: 32,
    fontSize: 13,
    fontWeight: '500',
  },
  distBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  distBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  distCount: {
    width: 28,
    fontSize: 12,
    textAlign: 'right',
  },
  reviewsSection: {
    flex: 1,
  },
  reviewsList: {
    maxHeight: 200,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11,
  },
  noReviews: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
