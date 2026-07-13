import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography, spacing, shadow } from '../../theme/tokens';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { normalizeImage } from '../../utils/image';

interface ClubCardProps {
  club: any;
  onPress: () => void;
}

export function ClubCard({ club, onPress }: ClubCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        shadow.md,
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Image
          source={normalizeImage(club.image)}
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.lg,
            backgroundColor: colors.skeleton,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { color: colors.text }]} numberOfLines={1}>
            {club.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {club.category} · {club.members || 0} members
          </Text>
        </View>
        {club.status === 'Active' ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="warning" size="sm">{club.status}</Badge>
        )}
      </View>

      {club.shortDescription ? (
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={2}>
          {club.shortDescription}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {club.leaders && club.leaders.length > 0 && (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              👤 {club.leaders[0].name}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 12 }}>⭐</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {club.rating ? club.rating.toFixed(1) : '0.0'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
