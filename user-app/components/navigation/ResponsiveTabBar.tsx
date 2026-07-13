import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';

interface ResponsiveTabBarProps {
  state: any;
  navigation: any;
}

const tabConfig: Record<string, { label: string; icon: string }> = {
  EventsTab: { label: 'Events', icon: '📅' },
  Recommendations: { label: 'Discover', icon: '✨' },
  ClubsTab: { label: 'Clubs', icon: '👥' },
  Profile: { label: 'Profile', icon: '👤' },
};

export function ResponsiveTabBar({ state, navigation }: ResponsiveTabBarProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const isDesktop = r.width >= 900;

  if (isDesktop) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, gap: spacing.xs }}>
          <Text style={[typography.h4, { color: colors.primary, marginRight: spacing.xl }]}>CUZ Events</Text>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const config = tabConfig[route.name];
            if (!config) return null;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.lg,
                  backgroundColor: isFocused ? colors.primaryLight : 'transparent',
                }}
              >
                <Text style={{ fontSize: 16 }}>{config.icon}</Text>
                <Text
                  style={[
                    typography.label,
                    { color: isFocused ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.tabBar,
        shadow.lg,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.md,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const config = tabConfig[route.name];
        if (!config) return null;

        const onPress = () => {
          navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <Text style={{ fontSize: isFocused ? 22 : 20, opacity: isFocused ? 1 : 0.5 }}>
              {config.icon}
            </Text>
            <Text
              style={[
                typography.overline,
                {
                  color: isFocused ? colors.primary : colors.textMuted,
                  fontWeight: isFocused ? '700' : '400',
                  marginTop: 2,
                },
              ]}
            >
              {config.label}
            </Text>
            {isFocused && (
              <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  indicator: {
    position: 'absolute',
    top: -1,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
