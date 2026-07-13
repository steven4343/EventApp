import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius } from '../../theme/tokens';

interface DesktopNavProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

const navItems = [
  { key: 'EventsTab', label: 'Events', icon: '📅' },
  { key: 'Recommendations', label: 'Discover', icon: '✨' },
  { key: 'ClubsTab', label: 'Clubs', icon: '👥' },
  { key: 'Profile', label: 'Profile', icon: '👤' },
];

export function DesktopNav({ activeRoute, onNavigate }: DesktopNavProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const ph = horizontalPadding(r);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: ph,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          height: 48,
        }}
      >
        {navItems.map(item => {
          const isActive = activeRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: isActive ? colors.primaryLight : 'transparent',
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text
                style={[
                  typography.label,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
