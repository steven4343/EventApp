import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding, getCardWidth } from '../../theme/responsive';
import { adminApi } from '../../api';
import { ScreenHeader } from '../ui/ScreenHeader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';
import NotificationDropdown from '../NotificationDropdown';
import CreateEventModal from './CreateEventModal';

const CATEGORIES = ['', 'Music Concert', 'Conference', 'Sports', 'Church Event', 'Community', 'Workshop'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: '#22c55e20', text: '#22c55e' },
  draft: { bg: '#eab30820', text: '#eab308' },
  cancelled: { bg: '#ef444420', text: '#ef4444' },
};

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: size, color: star <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>
          ★
        </Text>
      ))}
      <Text style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
        {rating > 0 ? rating.toFixed(1) : 'N/A'}
      </Text>
    </View>
  );
};

interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  location: string;
  status: 'published' | 'draft' | 'cancelled';
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
}

export default function EventsManagementScreen({ navigation }: EventsManagementScreenProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const { isMobile, isTablet, isDesktop } = r;
  const px = horizontalPadding(r);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackData | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

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
    const action = event.status === 'published' ? 'unpublish' : 'publish';
    const actionLabel = event.status === 'published' ? 'Unpublish' : 'Publish';

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

    try {
      if (event.status === 'published') {
        await adminApi.unpublishEvent(event.id);
      } else {
        await adminApi.publishEvent(event.id);
      }
      fetchEvents();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} event.`);
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

    try {
      await adminApi.deleteEvent(event.id);
      fetchEvents();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete event.');
    }
  };

  const handleOpenFeedback = async (event: Event) => {
    setFeedbackLoading(true);
    try {
      const data = await adminApi.getEventReviews(event.id);
      setFeedbackModal({
        eventId: event.id,
        eventTitle: event.title,
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        distribution: data.distribution || [0, 0, 0, 0, 0],
        reviews: data.reviews || [],
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

  const getGridColumns = () => {
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 1;
  };

  const renderEventCard = (event: Event) => {
    const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.draft;

    return (
      <View
        key={event.id}
        style={[
          styles.card,
          {
            backgroundColor: colors.card || '#ffffff',
            width: isMobile ? '100%' : getCardWidth(r.width - px * 2, isDesktop ? 3 : 2, 16),
            shadowColor: '#000',
          },
          Platform.OS === 'web' && styles.cardWeb,
        ]}
      >
        {event.imageUrl ? (
          <View style={[styles.cardImage, { backgroundColor: colors.border || '#e5e7eb' }]}>
            <Text style={styles.cardImagePlaceholder}>📷</Text>
          </View>
        ) : (
          <View style={[styles.cardImage, { backgroundColor: colors.border || '#e5e7eb' }]}>
            <Text style={styles.cardImagePlaceholder}>🎉</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardCategory, { color: colors.primary || '#6366f1' }]} numberOfLines={1}>
              {event.category || 'Uncategorized'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: colors.text || '#111827' }]} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.cardInfo}>
            <Text style={[styles.cardInfoText, { color: colors.textSecondary || '#6b7280' }]}>
              📅 {formatDate(event.date)}
            </Text>
            <Text style={[styles.cardInfoText, { color: colors.textSecondary || '#6b7280' }]} numberOfLines={1}>
              📍 {event.location}
            </Text>
          </View>

          <View style={styles.cardStats}>
            <StarRating rating={event.rating} />
            <Text style={[styles.reviewCount, { color: colors.textSecondary || '#9ca3af' }]}>
              ({event.reviewCount || 0})
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.attendeeText, { color: colors.textSecondary || '#6b7280' }]}>
              👥 {event.attendeeCount || 0} attendees
            </Text>
          </View>

          <View style={[styles.cardActions, { borderTopColor: colors.border || '#f3f4f6' }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: event.status === 'published' ? '#eab30815' : '#22c55e15' }]}
              onPress={() => handlePublishToggle(event)}
            >
              <Text style={[styles.actionBtnText, { color: event.status === 'published' ? '#eab308' : '#22c55e' }]}>
                {event.status === 'published' ? 'Unpublish' : 'Publish'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6366f115' }]}
              onPress={() => handleOpenFeedback(event)}
              disabled={feedbackLoading}
            >
              <Text style={[styles.actionBtnText, { color: '#6366f1' }]}>
                {feedbackLoading ? '...' : 'Feedback'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
              onPress={() => handleDelete(event)}
            >
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFeedbackModal = () => {
    if (!feedbackModal) return null;

    const maxDist = Math.max(...feedbackModal.distribution, 1);

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.feedbackModal, { backgroundColor: colors.card || '#ffffff' }]}>
          <View style={styles.feedbackHeader}>
            <Text style={[styles.feedbackTitle, { color: colors.text || '#111827' }]}>
              Feedback: {feedbackModal.eventTitle}
            </Text>
            <TouchableOpacity onPress={() => setFeedbackModal(null)}>
              <Text style={[styles.closeBtn, { color: colors.textSecondary || '#6b7280' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feedbackSummary}>
            <Text style={[styles.bigRating, { color: colors.text || '#111827' }]}>
              {feedbackModal.averageRating.toFixed(1)}
            </Text>
            <StarRating rating={feedbackModal.averageRating} size={20} />
            <Text style={[styles.totalReviews, { color: colors.textSecondary || '#9ca3af' }]}>
              {feedbackModal.totalReviews} reviews
            </Text>
          </View>

          <View style={styles.distributionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text || '#111827' }]}>Rating Distribution</Text>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = feedbackModal.distribution[star - 1] || 0;
              const percentage = maxDist > 0 ? (count / maxDist) * 100 : 0;
              return (
                <View key={star} style={styles.distributionRow}>
                  <Text style={[styles.distLabel, { color: colors.textSecondary || '#6b7280' }]}>{star}★</Text>
                  <View style={[styles.distBarBg, { backgroundColor: colors.border || '#e5e7eb' }]}>
                    <View style={[styles.distBarFill, { width: `${percentage}%`, backgroundColor: '#f59e0b' }]} />
                  </View>
                  <Text style={[styles.distCount, { color: colors.textSecondary || '#9ca3af' }]}>{count}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text || '#111827' }]}>Individual Reviews</Text>
            {feedbackModal.reviews.length === 0 ? (
              <Text style={[styles.noReviews, { color: colors.textSecondary || '#9ca3af' }]}>
                No reviews yet.
              </Text>
            ) : (
              <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
                {feedbackModal.reviews.map((review) => (
                  <View key={review.id} style={[styles.reviewCard, { borderColor: colors.border || '#f3f4f6' }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewerName, { color: colors.text || '#111827' }]}>
                        {review.userName}
                      </Text>
                      <StarRating rating={review.rating} size={12} />
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.textSecondary || '#6b7280' }]}>
                      {review.comment}
                    </Text>
                    <Text style={[styles.reviewDate, { color: colors.textSecondary || '#9ca3af' }]}>
                      {formatDate(review.createdAt)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background || '#f9fafb' }]}>
      <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
        <NotificationDropdown />
      </View>
      <ScreenHeader
        title="Events Management"
        rightAction={
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary || '#6366f1' }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: colors.card || '#ffffff' }]}
        contentContainerStyle={styles.filterBarContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCategory === cat ? (colors.primary || '#6366f1') : (colors.border || '#f3f4f6'),
              },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedCategory === cat ? '#ffffff' : (colors.textSecondary || '#6b7280'),
                },
              ]}
            >
              {cat || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.statusBar, { backgroundColor: colors.card || '#ffffff' }]}
        contentContainerStyle={styles.statusBarContent}
      >
        {['', 'published', 'draft', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusChip,
              {
                backgroundColor: selectedStatus === status ? (colors.primary || '#6366f1') : (colors.border || '#f3f4f6'),
              },
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: selectedStatus === status ? '#ffffff' : (colors.textSecondary || '#6b7280'),
                },
              ]}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Status'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No Events Found"
          message="Create your first event or adjust your filters."
        />
      ) : (
        <ScrollView
          style={styles.eventsList}
          contentContainerStyle={[
            styles.eventsGrid,
            {
              paddingHorizontal: px,
            },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View
            style={[
              styles.gridContainer,
              {
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap',
                gap: 16,
              },
            ]}
          >
            {filteredEvents.map((event) => (
              <View
                key={event.id}
                style={{
                  width: isMobile ? '100%' : `${100 / getGridColumns() - 2}%`,
                  minWidth: isMobile ? '100%' : 300,
                }}
              >
                {renderEventCard(event)}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {renderFeedbackModal()}

      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchEvents();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  newBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterBar: {
    maxHeight: 60,
  },
  filterBarContent: {
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
  eventsList: {
    flex: 1,
  },
  eventsGrid: {
    paddingVertical: 16,
  },
  gridContainer: {},
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardWeb: {
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardImage: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholder: {
    fontSize: 40,
  },
  cardBody: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 22,
  },
  cardInfo: {
    gap: 4,
    marginBottom: 10,
  },
  cardInfoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 6,
  },
  cardFooter: {
    marginBottom: 12,
  },
  attendeeText: {
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
