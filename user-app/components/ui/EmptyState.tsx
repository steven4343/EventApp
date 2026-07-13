import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius } from '../../theme/tokens';
import { Button } from './Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxxl, paddingHorizontal: spacing.xxxl }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>{emoji}</Text>
      <Text style={[typography.h4, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>
        {title}
      </Text>
      {description && (
        <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginBottom: actionLabel ? spacing.lg : 0, maxWidth: 300 }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
