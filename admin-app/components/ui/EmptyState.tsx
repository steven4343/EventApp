import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  icon: string;
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={[s.title, { color: colors.text }]}>{title}</Text>
      {message && <Text style={[s.message, { color: colors.textMuted }]}>{message}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
