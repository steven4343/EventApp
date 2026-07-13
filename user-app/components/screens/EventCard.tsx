import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../theme/responsive';
import { radius, typography, spacing, shadow } from '../../theme/tokens';
import { Badge } from '../ui/Badge';
import { normalizeImage } from '../../utils/image';

interface EventCardProps {
  event: any;
  onPress: () => void;
  onFavorite?: () => void;
  isSaved?: boolean;
}

export function EventCard({ event, onPress, onFavorite, isSaved }: EventCardProps) {
  const { colors } = useTheme();
  const r = useResponsive();

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return 'Free';
    return `ZMW ${price}`;
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, shadow.md, { backgroundColor: colors.card, borderRadius: radius.xl }]}>
      <View style={styles.imageContainer}>
        <Image
          source={normalizeImage(event.image)}
          style={[styles.image, { backgroundColor: colors.skeleton }]}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <Badge variant="primary" size="sm">{event.category || 'Event'}</Badge>
          <TouchableOpacity
            onPress={onFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.favoriteBtn}
          >
            <Text style={{ fontSize: 18 }}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        {event.price === 0 && (
          <View style={[styles.freeTag, { backgroundColor: colors.success }]}>
            <Text style={[typography.overline, { color: '#fff' }]}>FREE</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[typography.label, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>📅 {formatDate(event.date)}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>📍 {event.location || 'TBA'}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.priceBadge}>
            <Text style={[typography.label, { color: event.price === 0 ? colors.success : colors.primary }]}>
              {formatPrice(event.price)}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Text style={{ fontSize: 12 }}>⭐</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {event.rating ? event.rating.toFixed(1) : '0.0'}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {event.attendees || 0}/{event.maxCapacity || '∞'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  favoriteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeTag: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  info: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    gap: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  priceBadge: {
    backgroundColor: 'transparent',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
