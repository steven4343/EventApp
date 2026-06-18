import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Event } from '../../types';
import { userApi } from '../../api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RegistrationModal } from '../ui/RegistrationModal';
import { normalizeImage } from '../../utils/image';

export function EventDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventId = route.params?.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eventReviews, setEventReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);

  useEffect(() => {
    userApi.getEventById(eventId).then(data => {
      setEvent(data);
      setLoading(false);
    });
    userApi.getSavedEvents().then(saved => {
      const isEventSaved = saved.some((s: any) => s.eventId === eventId || s.id === eventId);
      setIsSaved(isEventSaved);
    }).catch(() => {});
  }, [eventId]);

  useEffect(() => {
    userApi.getEventReviews(eventId).then(data => {
      setEventReviews(data.reviews || []);
      setReviewStats(data.stats);
    }).catch(() => {});
  }, [eventId, submitted]);

  const toggleSave = async () => {
    setSavedLoading(true);
    try {
      if (isSaved) {
        await userApi.unsaveEvent(eventId);
        setIsSaved(false);
      } else {
        await userApi.saveEvent(eventId);
        setIsSaved(true);
      }
    } catch (e) {
      console.error('Failed to toggle save:', e);
    }
    setSavedLoading(false);
  };

  const isPastEvent = new Date(event.date) < new Date();

  const handleSubmitReview = async () => {
    if (userRating === 0) {
      Alert.alert('Select Rating', 'Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      const result = await userApi.addReview(eventId, 'event', userRating, userComment);
      if (result.event) setEvent(result.event);
      setSubmitted(true);
      setUserRating(0);
      setUserComment('');
      Alert.alert('Thank You!', 'Your feedback has been submitted');
    } catch {
      Alert.alert('Error', 'Failed to submit feedback');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text>Event not found</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={normalizeImage(event.image)} style={styles.image} resizeMode="contain" />
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={toggleSave} disabled={savedLoading}>
          <Text style={styles.saveButtonText}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Badge variant="default">{event.category}</Badge>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>★ {event.rating}</Text>
              <Text style={styles.reviewsText}>({event.reviews} reviews)</Text>
            </View>
          </View>

          <Text style={styles.title}>{event.title}</Text>
          
          <TouchableOpacity style={styles.clubButton}>
            <Text style={styles.clubButtonText}>{event.club}</Text>
          </TouchableOpacity>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎟️</Text>
              <View>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>
                  {event.price === 0 ? 'Free' : `K${event.price}`}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👥</Text>
              <View>
                <Text style={styles.infoLabel}>Attendees</Text>
                <Text style={styles.infoValue}>
                  {event.attendees} / {event.maxCapacity}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {isPastEvent && (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionTitle}>Feedback & Reviews</Text>
              {reviewStats && (
                <View style={styles.statsRow}>
                  <Text style={styles.starsLarge}>★ {reviewStats.averageRating}</Text>
                  <Text style={styles.statsText}>{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</Text>
                </View>
              )}
              {eventReviews.length > 0 && (
                <View style={styles.reviewsList}>
                  {eventReviews.slice(0, 5).map(r => (
                    <View key={r.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>{r.userName || 'Anonymous'}</Text>
                        <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                      </View>
                      {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
              {!submitted && (
                <View style={styles.feedbackForm}>
                  <Text style={styles.feedbackLabel}>Rate this event</Text>
                  <View style={styles.starPicker}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity key={n} onPress={() => setUserRating(n)}>
                        <Text style={[styles.starOption, userRating >= n && styles.starSelected]}>★</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Share your thoughts (optional)"
                    placeholderTextColor="#94a3b8"
                    value={userComment}
                    onChangeText={setUserComment}
                    multiline
                  />
                  <TouchableOpacity style={styles.submitFeedbackButton} onPress={handleSubmitReview} disabled={submitting}>
                    <Text style={styles.submitFeedbackText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {submitted && (
                <Text style={styles.thankYouText}>✓ You've submitted feedback for this event</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            {event.price === 0 ? 'Free' : `K${event.price}`}
          </Text>
        </View>
        <Button style={styles.registerButton} onPress={() => setShowRegistration(true)}>Register Now</Button>
      </View>

      <RegistrationModal
        visible={showRegistration}
        onClose={() => setShowRegistration(false)}
        eventTitle={event.title}
        eventId={event.id}
        eventPrice={event.price}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#f1f5f9',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 20,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviewsText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  clubButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  clubButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  descriptionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  feedbackSection: {
    marginTop: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starsLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
  },
  reviewsList: {
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  reviewStars: {
    fontSize: 14,
    color: '#f59e0b',
  },
  reviewComment: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  feedbackForm: {
    marginTop: 8,
  },
  feedbackLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starOption: {
    fontSize: 32,
    color: '#e2e8f0',
  },
  starSelected: {
    color: '#f59e0b',
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitFeedbackButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitFeedbackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  thankYouText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  priceContainer: {},
  priceLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  registerButton: {
    flex: 1,
    marginLeft: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
