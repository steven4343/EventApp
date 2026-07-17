import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  RefreshControl,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useResponsive, horizontalPadding } from "../../theme/responsive";
import { adminApi } from "../../api";
import { ScreenHeader } from "../ui/ScreenHeader";
import { LoadingSkeleton, StatSkeleton } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";

interface StatItem {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}

const STATS_CONFIG = [
  {
    key: "totalUsers",
    icon: "👥",
    label: "Total Users",
    color: "#6366F1",
    bg: "rgba(99, 102, 241, 0.1)",
  },
  {
    key: "publishedEvents",
    icon: "🎉",
    label: "Published Events",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  {
    key: "draftEvents",
    icon: "📝",
    label: "Draft Events",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  {
    key: "pendingEvents",
    icon: "⏳",
    label: "Pending Approval",
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.1)",
  },
  {
    key: "activeClubs",
    icon: "🏛️",
    label: "Active Clubs",
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  {
    key: "pendingClubs",
    icon: "⏳",
    label: "Pending Clubs",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.1)",
  },
  {
    key: "ticketsSold",
    icon: "🎫",
    label: "Tickets Sold",
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.1)",
  },
] as const;

interface DashboardScreenProps {
  refreshKey?: number;
}

export default function DashboardScreen({ refreshKey }: DashboardScreenProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const { isMobile, isTablet, isDesktop, isWideDesktop } = r;
  const px = horizontalPadding(r);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getColumns = (): number => {
    if (isWideDesktop) return 6;
    if (isDesktop) return 3;
    if (isTablet) return 3;
    return 2;
  };

  const columns = getColumns();

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchStats();
    }
  }, [refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStatCard = (config: (typeof STATS_CONFIG)[number]) => {
    const value = stats?.[config.key] ?? 0;
    return (
      <Pressable
        key={config.key}
        style={({ hovered }) => [
          styles.statCard,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
            borderColor: colors.border,
            ...(hovered && Platform.OS === "web"
              ? {
                  transform: [{ translateY: -2 }],
                  shadowColor: config.color,
                  shadowOpacity: 0.25,
                }
              : {}),
          },
        ]}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: config.bg }]}
        >
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {value.toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {config.label}
        </Text>
      </Pressable>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.statsGrid, { gap: 16 }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={{
                flexBasis: `${100 / columns - (16 * (columns - 1)) / columns}%`,
              }}
            >
              <StatSkeleton />
            </View>
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          title="Something went wrong"
          subtitle={error}
          actionLabel="Retry"
          onAction={fetchStats}
        />
      );
    }

    if (!stats) {
      return (
        <EmptyState
          title="No data available"
          subtitle="Dashboard statistics will appear here once available."
        />
      );
    }

    return (
      <View style={[styles.statsGrid, { gap: 16 }]}>
        {STATS_CONFIG.map((config) => (
          <View
            key={config.key}
            style={{
              flexBasis: `${100 / columns - (16 * (columns - 1)) / columns}%`,
            }}
          >
            {renderStatCard(config)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        (isDesktop || isWideDesktop) && styles.centeredContent,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View
        style={[
          styles.inner,
          { paddingHorizontal: px },
          (isDesktop || isWideDesktop) && styles.maxWidth,
        ]}
      >
        <ScreenHeader title="Dashboard" subtitle="Overview of your platform" />

        <View
          style={[
            styles.welcomeSection,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Welcome back, Admin
          </Text>
          <Text style={[styles.welcomeDate, { color: colors.textSecondary }]}>
            {formatDate()}
          </Text>
        </View>

        {renderContent()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centeredContent: {
    alignItems: "center",
  },
  inner: {
    width: "100%",
  },
  maxWidth: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  welcomeSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    marginTop: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  welcomeDate: {
    fontSize: 14,
    fontWeight: "400",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === "web"
      ? {
          cursor: "pointer" as any,
          transitionProperty: "transform, shadow-opacity",
          transitionDuration: "200ms",
        }
      : {}),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  icon: {
    fontSize: 22,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
