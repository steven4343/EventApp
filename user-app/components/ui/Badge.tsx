import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography, spacing } from '../../theme/tokens';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  style?: any;
}

export function Badge({ children, variant = 'default', size = 'sm', style }: BadgeProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary': return { bg: colors.primaryLight, text: colors.primary };
      case 'secondary': return { bg: colors.surface, text: colors.textSecondary };
      case 'outline': return { bg: 'transparent', text: colors.textSecondary };
      case 'success': return { bg: colors.successLight, text: colors.success };
      case 'warning': return { bg: colors.warningLight, text: colors.warning };
      case 'danger': return { bg: '#fef2f2', text: colors.danger };
      default: return { bg: colors.surface, text: colors.textSecondary };
    }
  };

  const { bg, text: textColor } = getColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          alignSelf: 'flex-start',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
        },
        isSmall
          ? { paddingVertical: 2, paddingHorizontal: spacing.sm }
          : { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
        style,
      ]}
    >
      <Text
        style={[
          isSmall ? typography.caption : typography.label,
          { color: textColor },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
