import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../theme/responsive';

export type AdminTabKey = 'Dashboard' | 'Events' | 'Clubs' | 'Verify' | 'Payments' | 'Settings';

interface TabDef {
  key: AdminTabKey;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'Events', label: 'Events', icon: '📅' },
  { key: 'Clubs', label: 'Clubs', icon: '👥' },
  { key: 'Verify', label: 'Scan', icon: '📷' },
  { key: 'Payments', label: 'Payments', icon: '💳' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
];

interface Props {
  active: AdminTabKey;
  onSelect: (tab: AdminTabKey) => void;
}

export function AdminTabBar({ active, onSelect }: Props) {
  const { colors } = useTheme();
  const r = useResponsive();

  if (r.isDesktop || r.isWideDesktop || r.isUltraWide) {
    return (
      <View style={[s.desktopNav, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.desktopInner}>
          <View style={s.brandArea}>
            <Text style={[s.brandIcon, { color: colors.primary }]}>🛡️</Text>
            <Text style={[s.brandText, { color: colors.text }]}>CUZ Admin</Text>
          </View>
          <View style={s.desktopTabs}>
            {TABS.map(tab => {
              const isActive = active === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[s.desktopTab, isActive && { backgroundColor: colors.primaryLight }]}
                  onPress={() => onSelect(tab.key)}
                >
                  <Text style={s.tabIcon}>{tab.icon}</Text>
                  <Text style={[s.desktopTabText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.mobileTabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {TABS.map(tab => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={s.mobileTab}
            onPress={() => onSelect(tab.key)}
          >
            <View style={[s.mobileIconWrap, isActive && { backgroundColor: colors.primaryLight }]}>
              <Text style={s.tabIcon}>{tab.icon}</Text>
            </View>
            <Text style={[s.mobileTabText, { color: isActive ? colors.primary : colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  mobileTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 8,
  },
  mobileTab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  mobileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTabText: {
    fontSize: 10,
    fontWeight: '600',
  },
  desktopNav: {
    borderBottomWidth: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  desktopInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 32,
  },
  brandIcon: {
    fontSize: 24,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
  },
  desktopTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  desktopTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  desktopTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 18,
  },
});
