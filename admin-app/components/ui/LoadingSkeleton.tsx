import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  width?: number;
  height?: number;
  borderRadius?: number;
  count?: number;
}

export function LoadingSkeleton({ width: w = 200, height: h = 20, borderRadius: br = 8, count = 1 }: Props) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            width: w,
            height: h,
            borderRadius: br,
            backgroundColor: colors.skeleton,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

export function StatSkeleton() {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={[s.card, { backgroundColor: colors.card }]}>
      <Animated.View style={[s.statNum, { backgroundColor: colors.skeleton, opacity }]} />
      <Animated.View style={[s.statLabel, { backgroundColor: colors.skeleton, opacity }]} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  statNum: { width: 60, height: 32, borderRadius: 8 },
  statLabel: { width: 80, height: 14, borderRadius: 4, marginTop: 8 },
});
