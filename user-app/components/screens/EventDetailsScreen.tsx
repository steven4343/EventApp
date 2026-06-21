import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Event } from '../../types';
import { userApi } from '../../api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RegistrationModal } from '../ui/RegistrationModal';
import { normalizeImage } from '../../utils/image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function EventDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
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
    }).catch(() => {}).finally(() => {
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

  const handleSubmitReview = async () => {
    if (userRating === 0) {
      Alert.alert(t('eventDetails.selectRating'), t('eventDetails.pleaseSelectRating'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await userApi.addReview(eventId, 'event', userRating, userComment);
      if (result.event) setEvent(result.event);
      setSubmitted(true);
      setUserRating(0);
      setUserComment('');
      Alert.alert(t('eventDetails.thankYou'), t('eventDetails.feedbackReceived'));
    } catch {
      Alert.alert(t('login.error'), t('eventDetails.failedFeedback'));
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('eventDetails.eventNotFound')}</Text>
      </View>
    );
  }

  const isPastEvent = new Date(event.date) < new Date();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={normalizeImage(event.image)} style={[styles.image, { backgroundColor: colors.border }]} resizeMode="contain" />
        
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.card }]} onPress={toggleSave} disabled={savedLoading}>
          <Text style={styles.saveButtonText}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Badge variant="default">{event.category}</Badge>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: colors.warning }]}>★ {event.rating}</Text>
              <Text style={[styles.reviewsText, { color: colors.textSecondary }]}>({event.reviews} {t('eventDetails.reviews')})</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
          
          <TouchableOpacity style={[styles.clubButton, { backgroundColor: colors.border }]}>
            <Text style={[styles.clubButtonText, { color: colors.primary }]}>{event.club}</Text>
          </TouchableOpacity>

          <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('eventDetails.date')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('eventDetails.time')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('eventDetails.location')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{event.location}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎟️</Text>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('eventDetails.price')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.price === 0 ? t('eventDetails.free') : `K${event.price}`}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👥</Text>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('eventDetails.attendees')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {event.attendees} / {event.maxCapacity}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('eventDetails.about')}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>
          </View>

          {isPastEvent && (
            <View style={[styles.feedbackSection, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('eventDetails.feedback')}</Text>
              {reviewStats && (
                <View style={styles.statsRow}>
                  <Text style={[styles.starsLarge, { color: colors.warning }]}>★ {reviewStats.averageRating}</Text>
                  <Text style={[styles.statsText, { color: colors.textSecondary }]}>{reviewStats.totalReviews} {t('eventDetails.reviews')}</Text>
                </View>
              )}
              {eventReviews.length > 0 && (
                <View style={styles.reviewsList}>
                  {eventReviews.slice(0, 5).map(r => (
                    <View key={r.id} style={[styles.reviewItem, { backgroundColor: colors.card }]}>
                      <View style={styles.reviewHeader}>
                        <Text style={[styles.reviewerName, { color: colors.text }]}>{r.userName || 'Anonymous'}</Text>
                        <Text style={[styles.reviewStars, { color: colors.warning }]}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                      </View>
                      {r.comment ? <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{r.comment}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
              {!submitted && (
                <View style={styles.feedbackForm}>
                  <Text style={[styles.feedbackLabel, { color: colors.text }]}>{t('eventDetails.rateThis')}</Text>
                  <View style={styles.starPicker}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity key={n} onPress={() => setUserRating(n)}>
                        <Text style={[styles.starOption, { color: colors.border }, userRating >= n && { color: colors.warning }]}>★</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder={t('eventDetails.shareThoughts')}
                    placeholderTextColor={colors.textMuted}
                    value={userComment}
                    onChangeText={setUserComment}
                    multiline
                  />
                  <TouchableOpacity style={[styles.submitFeedbackButton, { backgroundColor: colors.primary }]} onPress={handleSubmitReview} disabled={submitting}>
                    <Text style={[styles.submitFeedbackText, { color: colors.headerText }]}>{submitting ? t('eventDetails.submitting') : t('eventDetails.submitFeedback')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {submitted && (
                <Text style={[styles.thankYouText, { color: colors.success }]}>✓ {t('eventDetails.feedbackSubmitted')}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {!isPastEvent && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('eventDetails.price')}</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {event.price === 0 ? t('eventDetails.free') : `K${event.price}`}
            </Text>
          </View>
          <Button style={styles.registerButton} onPress={() => setShowRegistration(true)}>{t('eventDetails.registerNow')}</Button>
        </View>
      )}

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
