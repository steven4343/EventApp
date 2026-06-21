import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Club } from '../../types';
import { userApi } from '../../api';
import { normalizeImage } from '../../utils/image';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

type RouteParams = {
  ClubDetails: {
    clubId: string;
  };
};

const categoryColors: { [key: string]: string } = {
  'Health & Wellness': '#10b981',
  'Arts': '#8b5cf6',
  'Academic': '#3b82f6',
  'Technology': '#06b6d4',
  'Cultural': '#f59e0b',
  'Games': '#ec4899',
  'Religious': '#6366f1',
  'Service': '#14b8a6',
};

export function ClubDetailsScreen() {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const route = useRoute<RouteProp<RouteParams, 'ClubDetails'>>();
  const { clubId } = route.params;
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<{ role: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await userApi.getClubForScreenById(clubId);
      setClub(data);
      const mem = await userApi.getClubMembership(clubId);
      setMembership(mem);
    } catch (e) {
      setError(t('clubs.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clubId]);

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await userApi.requestJoinClub(clubId);
      const mem = await userApi.getClubMembership(clubId);
      setMembership(mem);
    } catch (e) {
      Alert.alert('Error', 'Failed to request join');
    }
    setActionLoading(false);
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await userApi.leaveClub(clubId);
      setMembership(null);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to leave club');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => { setLoading(true); setError(null); loadData(); }}>
          <Text style={[styles.retryButtonText, { color: colors.headerText }]}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!club) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{t('clubs.clubNotFound')}</Text>
      </View>
    );
  }

  const categoryColor = categoryColors[club.category] || '#6b7280';

  const renderButton = () => {
    if (!userApi.getCurrentUser()) {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Login' as never)}>
          <Text style={[styles.joinButtonText, { color: colors.headerText }]}>{t('clubs.signInToJoin')}</Text>
        </TouchableOpacity>
      );
    }
    if (actionLoading) {
      return (
        <View style={[styles.joinButton, { backgroundColor: colors.primary }]}>
          <ActivityIndicator color={colors.headerText} />
        </View>
      );
    }
    if (!membership) {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.primary }]} onPress={handleJoin}>
          <Text style={[styles.joinButtonText, { color: colors.headerText }]}>{t('clubs.requestToJoin')}</Text>
        </TouchableOpacity>
      );
    }
    if (membership.role === 'Pending') {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.warning }]} onPress={handleLeave}>
          <Text style={[styles.joinButtonText, { color: colors.headerText }]}>{t('clubs.pendingApproval')}</Text>
        </TouchableOpacity>
      );
    }
    if (membership.role === 'President') {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.danger }]} onPress={handleLeave}>
          <Text style={[styles.joinButtonText, { color: colors.headerText }]}>{t('clubs.leaveClub')}</Text>
        </TouchableOpacity>
      );
    }
    if (membership.role === 'Member') {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.danger }]} onPress={handleLeave}>
          <Text style={[styles.joinButtonText, { color: colors.headerText }]}>{t('clubs.leaveClub')}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, { color: colors.text }]}>{t('common.back')}</Text>
          </TouchableOpacity>
          {membership?.role === 'President' && (
            <TouchableOpacity style={[styles.manageButton, { backgroundColor: colors.success }]} onPress={() => navigation.navigate('ClubAdmin' as never, { clubId, clubName: club.name } as never)}>
              <Text style={[styles.manageButtonText, { color: colors.headerText }]}>{t('clubs.manage')}</Text>
            </TouchableOpacity>
          )}
          <Image source={normalizeImage(club.image)} style={styles.clubImage} resizeMode="contain" />
          <View style={styles.headerOverlay}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={[styles.categoryText, { color: colors.headerText }]}>{club.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
          <Text style={[styles.shortDescription, { color: colors.textSecondary }]}>{club.shortDescription}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{club.members}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('clubs.members')}</Text>
            </View>
            <View style={[styles.statItem, { 
              backgroundColor: club.status === 'active' ? '#dcfce7' : club.status === 'pending' ? '#fef9c3' : '#fee2e2' 
            }]}>
              <Text style={[styles.statText, { 
                color: club.status === 'active' ? '#166534' : club.status === 'pending' ? '#854d0e' : '#991b1b' 
              }]}>
                {club.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('clubs.about')}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{club.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('clubs.meetingDetails')}</Text>
            <View style={[styles.meetingCard, { backgroundColor: colors.card }]}>
              <View style={styles.meetingRow}>
                <Text style={styles.meetingIcon}>📅</Text>
                <Text style={[styles.meetingText, { color: colors.textSecondary }]}>{club.meetingTime}</Text>
              </View>
              <View style={styles.meetingRow}>
                <Text style={styles.meetingIcon}>📍</Text>
                <Text style={[styles.meetingText, { color: colors.textSecondary }]}>{club.meetingLocation}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('clubs.clubLeaders')}</Text>
            {club.leaders.map((leader, index) => (
              <View key={index} style={[styles.leaderCard, { backgroundColor: colors.card }]}>
                <View style={[styles.leaderAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.leaderInitial, { color: colors.headerText }]}>{leader.name.charAt(0)}</Text>
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={[styles.leaderName, { color: colors.text }]}>{leader.name}</Text>
                  <Text style={[styles.leaderRole, { color: colors.primary }]}>{leader.role}</Text>
                  <Text style={[styles.leaderEmail, { color: colors.textMuted }]}>{leader.email}</Text>
                </View>
              </View>
            ))}
          </View>

          {renderButton()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  manageButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  clubImage: {
    width: '100%',
    height: 250,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  clubName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  shortDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  meetingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meetingIcon: {
    fontSize: 20,
  },
  meetingText: {
    fontSize: 15,
    color: '#475569',
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  leaderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  leaderRole: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 2,
  },
  leaderEmail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
