import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/tokens';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  style?: any;
}

export function Avatar({ uri, name, size = 48, style }: AvatarProps) {
  const { colors } = useTheme();
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: colors.primary, fontSize: size * 0.38, fontWeight: '700' }}>
          {initials}
        </Text>
      )}
    </View>
  );
}
