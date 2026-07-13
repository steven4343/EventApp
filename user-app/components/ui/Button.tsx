import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography, spacing, shadow, animation } from '../../theme/tokens';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.lg,
      gap: spacing.sm,
    };

    const sizes = {
      sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 36 },
      md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 48 },
      lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, minHeight: 56 },
    };

    const variants: Record<string, ViewStyle> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.primaryLight },
      outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
      ghost: { backgroundColor: 'transparent' },
      danger: { backgroundColor: colors.danger },
    };

    return {
      ...base,
      ...sizes[size],
      ...variants[variant],
      opacity: isDisabled ? 0.5 : 1,
      ...(fullWidth ? { width: '100%' } : {}),
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary': return '#ffffff';
      case 'secondary': return colors.primary;
      case 'outline': return colors.text;
      case 'ghost': return colors.primary;
      case 'danger': return '#ffffff';
      default: return '#ffffff';
    }
  };

  const textSizes = {
    sm: typography.buttonSmall,
    md: typography.button,
    lg: { ...typography.button, fontSize: 17 },
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      style={[shadow.sm, getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[{ color: getTextColor() }, textSizes[size], textStyle]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
