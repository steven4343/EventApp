import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius } from '../../theme/tokens';
import { Avatar } from './Avatar';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  avatarUri?: string;
  avatarName?: string;
  onAvatarPress?: () => void;
  variant?: 'default' | 'transparent' | 'minimal';
  children?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  avatarUri,
  avatarName,
  onAvatarPress,
  variant = 'default',
  children,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const ph = horizontalPadding(r);

  if (variant === 'minimal') {
    return (
      <View style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: ph }}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginBottom: spacing.sm, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 18, color: colors.text }}>←</Text>
          </TouchableOpacity>
        )}
        {title && (
          <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
        )}
        {children}
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.headerBg,
        paddingTop: insets.top + spacing.md,
        paddingBottom: spacing.lg,
        paddingHorizontal: ph,
      }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          {title && (
            <Text style={[typography.h3, { color: colors.headerText }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[typography.bodySmall, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          {rightAction}
          {avatarUri || avatarName ? (
            <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
              <Avatar uri={avatarUri} name={avatarName} size={36} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}
