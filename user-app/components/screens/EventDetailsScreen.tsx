import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Event } from '../../types';
import { userApi } from '../../api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RegistrationModal } from '../ui/RegistrationModal';
import { normalizeImage } from '../../utils/image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';

export function EventDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();
  const ph = horizontalPadding(r);
  const isDesktop = r.width >= 900;

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <LoadingSkeleton height={250} borderRadius={0} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <Text style={[typography.body, { color: colors.text }]}>{t('eventDetails.eventNotFound')}</Text>
      </SafeAreaView>
    );
  }

  const isPastEvent = new Date(event.date) < new Date();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const infoItems = [
    { icon: '📅', label: t('eventDetails.date'), value: formatDate(event.date) },
    { icon: '🕐', label: t('eventDetails.time'), value: event.time },
    { icon: '📍', label: t('eventDetails.location'), value: event.location },
    { icon: '🎟️', label: t('eventDetails.price'), value: event.price === 0 ? t('eventDetails.free') : `K${event.price}` },
    { icon: '👥', label: t('eventDetails.attendees'), value: `${event.attendees} / ${event.maxCapacity}` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={{ position: 'relative' }}>
          <Image source={normalizeImage(event.image)} style={{ width: '100%', height: isDesktop ? 350 : 250, backgroundColor: colors.skeleton }} resizeMode="cover" />

          {/* Back button */}
          <TouchableOpacity
            style={[shadow.md, { position: 'absolute', top: 50, left: ph, backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[typography.label, { color: colors.text }]}>← {t('common.back')}</Text>
          </TouchableOpacity>

          {/* Save button */}
          <TouchableOpacity
            style={[shadow.md, { position: 'absolute', top: 50, right: ph, backgroundColor: colors.card, width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' }]}
            onPress={toggleSave}
            disabled={savedLoading}
          >
            <Text style={{ fontSize: 18 }}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={[isDesktop ? { maxWidth: 800, alignSelf: 'center', width: '100%' } : {}, { padding: ph, paddingBottom: 120 }]}>
          {/* Category + Rating */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.lg }}>
            <Badge variant="primary">{event.category}</Badge>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontSize: 14, color: colors.warning }}>★</Text>
              <Text style={[typography.label, { color: colors.warning }]}>{event.rating}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                ({event.reviews} {t('eventDetails.reviews')})
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.md }]}>{event.title}</Text>

          {/* Club badge */}
          <TouchableOpacity
            style={[shadow.sm, { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, marginBottom: spacing.xl }]}
          >
            <Text style={[typography.label, { color: colors.primary }]}>{event.club}</Text>
          </TouchableOpacity>

          {/* Info Grid */}
          <View style={[shadow.sm, { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.xl, gap: spacing.md }]}>
            {infoItems.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[typography.body, { color: colors.text }]}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{t('eventDetails.about')}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 26 }]}>{event.description}</Text>
          </View>

          {/* Feedback Section for Past Events */}
          {isPastEvent && (
            <View style={[shadow.sm, { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.md }]}>
              <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{t('eventDetails.feedback')}</Text>

              {reviewStats && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
                  <Text style={[typography.h2, { color: colors.warning }]}>★ {reviewStats.averageRating}</Text>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{reviewStats.totalReviews} {t('eventDetails.reviews')}</Text>
                </View>
              )}

              {eventReviews.length > 0 && (
                <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
                  {eventReviews.slice(0, 5).map((r: any) => (
                    <View key={r.id} style={[shadow.sm, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                        <Text style={[typography.label, { color: colors.text }]}>{r.userName || 'Anonymous'}</Text>
                        <Text style={[typography.label, { color: colors.warning }]}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </Text>
                      </View>
                      {r.comment && (
                        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{r.comment}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {!submitted ? (
                <View>
                  <Text style={[typography.label, { color: colors.text, marginBottom: spacing.md }]}>{t('eventDetails.rateThis')}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity key={n} onPress={() => setUserRating(n)}>
                        <Text style={{ fontSize: 32, color: userRating >= n ? colors.warning : colors.border }}>★</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={{
                      backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
                      fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border,
                      minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md,
                    }}
                    placeholder={t('eventDetails.shareThoughts')}
                    placeholderTextColor={colors.textMuted}
                    value={userComment}
                    onChangeText={setUserComment}
                    multiline
                  />
                  <Button variant="primary" onPress={handleSubmitReview} loading={submitting} fullWidth>
                    {submitting ? t('eventDetails.submitting') : t('eventDetails.submitFeedback')}
                  </Button>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                  <Text style={[typography.body, { color: colors.success }]}>✓ {t('eventDetails.feedbackSubmitted')}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer - Register Button */}
      {!isPastEvent && (
        <View style={[shadow.xl, { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: 36, borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{t('eventDetails.price')}</Text>
            <Text style={[typography.h3, { color: colors.primary }]}>
              {event.price === 0 ? t('eventDetails.free') : `K${event.price}`}
            </Text>
          </View>
          <Button variant="primary" onPress={() => setShowRegistration(true)} style={{ flex: 1, marginLeft: spacing.xl }}>
            {t('eventDetails.registerNow')}
          </Button>
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

function LoadingSkeleton({ height, borderRadius, style }: { height: number; borderRadius?: number; style?: any }) {
  const { colors } = useTheme();
  return <View style={[{ height, borderRadius: borderRadius || 0, backgroundColor: colors.skeleton }, style]} />;
}
