import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/tokens';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function LoadingSkeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: LoadingSkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

export function EventCardSkeleton({ style }: { style?: any }) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' }, style]}>
      <LoadingSkeleton height={160} borderRadius={0} />
      <View style={{ padding: 12, gap: 8 }}>
        <LoadingSkeleton width="60%" height={12} />
        <LoadingSkeleton width="90%" height={16} />
        <LoadingSkeleton width="40%" height={12} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <LoadingSkeleton width={60} height={20} borderRadius={radius.full} />
          <LoadingSkeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
}

export function ClubCardSkeleton({ style }: { style?: any }) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 10 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LoadingSkeleton width={52} height={52} borderRadius={26} />
        <View style={{ flex: 1, gap: 6 }}>
          <LoadingSkeleton width="70%" height={14} />
          <LoadingSkeleton width="40%" height={10} />
        </View>
      </View>
      <LoadingSkeleton width="100%" height={12} />
      <LoadingSkeleton width="80%" height={12} />
    </View>
  );
}
