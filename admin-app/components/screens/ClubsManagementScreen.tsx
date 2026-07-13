import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useResponsive, horizontalPadding, getCardWidth } from "../../theme/responsive";
import { adminApi } from "../../api";
import { ScreenHeader } from "../ui/ScreenHeader";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { Club } from "../../types";
import CreateClubModal from "./CreateClubModal";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  Pending: { bg: "rgba(245, 158, 11, 0.12)", text: "#d97706" },
  Inactive: { bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626" },
};

const STATUS_COLORS_DARK: Record<string, { bg: string; text: string }> = {
  Active: { bg: "rgba(74, 222, 128, 0.15)", text: "#4ade80" },
  Pending: { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24" },
  Inactive: { bg: "rgba(248, 113, 113, 0.15)", text: "#f87171" },
};

const CLUB_CATEGORIES = [
  "Academic",
  "Sports",
  "Arts",
  "Technology",
  "Social",
  "Volunteer",
  "Professional",
  "Other",
];

export default function ClubsManagementScreen() {
  const { colors, isDark } = useTheme();
  const r = useResponsive();
  const px = horizontalPadding(r);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const admin = adminApi.getCurrentAdmin();
  const statusColors = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;

  const getColumns = (): number => {
    if (r.isWideDesktop) return 3;
    if (r.isDesktop) return 3;
    if (r.isTablet) return 2;
    return 1;
  };

  const columns = getColumns();

  const fetchClubs = async () => {
    try {
      setError(null);
      const allClubs = await adminApi.getClubs();
      setClubs(allClubs);
    } catch (err: any) {
      setError(err?.message || "Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClubs();
    setRefreshing(false);
  };

  const handleApprove = async (club: Club) => {
    setActionLoading(club.id);
    try {
      await adminApi.approveClub(club.id);
      setClubs((prev) =>
        prev.map((c) => (c.id === club.id ? { ...c, status: "Active" as const } : c))
      );
    } catch {
      Alert.alert("Error", "Failed to approve club");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (club: Club) => {
    setActionLoading(club.id);
    try {
      await adminApi.deactivateClub(club.id);
      setClubs((prev) =>
        prev.map((c) => (c.id === club.id ? { ...c, status: "Inactive" as const } : c))
      );
    } catch {
      Alert.alert("Error", "Failed to deactivate club");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (club: Club) => {
    setActionLoading(club.id);
    try {
      await adminApi.reactivateClub(club.id);
      setClubs((prev) =>
        prev.map((c) => (c.id === club.id ? { ...c, status: "Active" as const } : c))
      );
    } catch {
      Alert.alert("Error", "Failed to reactivate club");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = useCallback(
    (club: Club) => {
      Alert.alert(
        "Delete Club",
        `Are you sure you want to delete "${club.name}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setActionLoading(club.id);
              try {
                await adminApi.deleteClub(club.id);
                setClubs((prev) => prev.filter((c) => c.id !== club.id));
              } catch {
                Alert.alert("Error", "Failed to delete club");
              } finally {
                setActionLoading(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleClubCreated = (newClub: Club) => {
    setClubs((prev) => [newClub, ...prev]);
    setModalVisible(false);
  };

  const getCategoryIcon = (category: string): string => {
    const map: Record<string, string> = {
      Academic: "📚",
      Sports: "⚽",
      Arts: "🎨",
      Technology: "💻",
      Social: "🤝",
      Volunteer: "❤️",
      Professional: "💼",
      Other: "📌",
    };
    return map[category] || "📌";
  };

  const renderClubCard = (club: Club) => {
    const badge = statusColors[club.status] || statusColors.Active;
    const isBusy = actionLoading === club.id;

    return (
      <Pressable
        key={club.id}
        style={({ hovered }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
            borderColor: colors.border,
            opacity: isBusy ? 0.6 : 1,
            ...(hovered && Platform.OS === "web"
              ? {
                  transform: [{ translateY: -3 }],
                  shadowColor: colors.primary,
                  shadowOpacity: 0.2,
                }
              : {}),
          },
        ]}
      >
        {club.image ? (
          <Image source={{ uri: club.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.surface }]}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(club.category)}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={[styles.clubName, { color: colors.text }]} numberOfLines={1}>
              {club.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{club.status}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                {getCategoryIcon(club.category)} {club.category}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Members</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                {club.members}
              </Text>
            </View>
          </View>

          {club.shortDescription ? (
            <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
              {club.shortDescription}
            </Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.actionsRow}>
            {club.status === "Pending" && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={() => handleApprove(club)}
              >
                <Text style={styles.actionBtnText}>Approve</Text>
              </Pressable>
            )}
            {club.status === "Active" && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                onPress={() => handleDeactivate(club)}
              >
                <Text style={styles.actionBtnText}>Deactivate</Text>
              </Pressable>
            )}
            {club.status === "Inactive" && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={() => handleReactivate(club)}
              >
                <Text style={styles.actionBtnText}>Reactivate</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionBtn, styles.deleteBtn, { borderColor: colors.danger }]}
              onPress={() => handleDelete(club)}
            >
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSkeleton = () => {
    const skeletonCount = columns;
    return (
      <View style={[styles.grid, { gap: 16 }]}>
        {Array.from({ length: skeletonCount * 2 }).map((_, i) => (
          <View
            key={i}
            style={{
              width:
                r.isMobile
                  ? "100%"
                  : `${100 / columns - (16 * (columns - 1)) / columns}%`,
            }}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <LoadingSkeleton width="100%" height={140} borderRadius={0} />
              <View style={{ padding: 16 }}>
                <LoadingSkeleton width="70%" height={20} borderRadius={6} />
                <View style={{ height: 8 }} />
                <LoadingSkeleton width="40%" height={14} borderRadius={4} />
                <View style={{ height: 8 }} />
                <LoadingSkeleton width="100%" height={14} borderRadius={4} />
                <LoadingSkeleton width="80%" height={14} borderRadius={4} />
                <View style={{ height: 12 }} />
                <LoadingSkeleton width="100%" height={36} borderRadius={10} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) return renderSkeleton();

    if (error) {
      return (
        <EmptyState icon="⚠️" title="Something went wrong" message={error} />
      );
    }

    if (clubs.length === 0) {
      return (
        <EmptyState
          icon="🏛️"
          title="No clubs yet"
          message="Create your first club to get started."
        />
      );
    }

    return (
      <View style={[styles.grid, { gap: 16 }]}>
        {clubs.map((club) => (
          <View
            key={club.id}
            style={{
              width: r.isMobile
                ? "100%"
                : `${100 / columns - (16 * (columns - 1)) / columns}%`,
            }}
          >
            {renderClubCard(club)}
          </View>
        ))}
      </View>
    );
  };

  const PlusButton = () => (
    <Pressable
      style={({ hovered }) => [
        styles.plusBtn,
        hovered && Platform.OS === "web" && { opacity: 0.85 },
      ]}
      onPress={() => setModalVisible(true)}
    >
      <Text style={styles.plusBtnText}>+ New</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.contentContainer,
          (r.isDesktop || r.isWideDesktop) && styles.centeredContent,
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
            (r.isDesktop || r.isWideDesktop) && styles.maxWidth,
          ]}
        >
          <ScreenHeader
            title="Clubs Management"
            subtitle={`${clubs.length} club${clubs.length !== 1 ? "s" : ""} total`}
            action={<PlusButton />}
          />

          <View style={styles.content}>{renderContent()}</View>
        </View>
      </ScrollView>

      <CreateClubModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={handleClubCreated}
      />
    </View>
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
  content: {
    marginTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
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
  cardImage: {
    width: "100%",
    height: 140,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: {
    fontSize: 36,
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clubName: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteBtn: {
    flex: 0.6,
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  plusBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  plusBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
