import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, action }: Props) {
  const { colors } = useTheme();
  const r = useResponsive();
  const px = horizontalPadding(r);

  return (
    <View style={[s.container, { backgroundColor: colors.primary, paddingHorizontal: px }]}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, r.isDesktop && s.titleDesktop]}>{title}</Text>
          {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
        {action}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  titleDesktop: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
