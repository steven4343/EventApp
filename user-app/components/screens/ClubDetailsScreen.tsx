import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Club } from '../../types';
import { userApi } from '../../api';
import { normalizeImage } from '../../utils/image';

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
  const route = useRoute<RouteProp<RouteParams, 'ClubDetails'>>();
  const { clubId } = route.params;
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<{ role: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    const data = await userApi.getClubForScreenById(clubId);
    setClub(data);
    const mem = await userApi.getClubMembership(clubId);
    setMembership(mem);
    setLoading(false);
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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Club not found</Text>
      </View>
    );
  }

  const categoryColor = categoryColors[club.category] || '#6b7280';

  const renderButton = () => {
    if (!userApi.getCurrentUser()) {
      return (
        <TouchableOpacity style={styles.joinButton} onPress={() => navigation.navigate('Login' as never)}>
          <Text style={styles.joinButtonText}>Sign in to Join</Text>
        </TouchableOpacity>
      );
    }
    if (actionLoading) {
      return (
        <View style={styles.joinButton}>
          <ActivityIndicator color="#fff" />
        </View>
      );
    }
    if (!membership) {
      return (
        <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
          <Text style={styles.joinButtonText}>Request to Join</Text>
        </TouchableOpacity>
      );
    }
    if (membership.role === 'Pending') {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: '#f59e0b' }]} onPress={handleLeave}>
          <Text style={styles.joinButtonText}>Pending Approval</Text>
        </TouchableOpacity>
      );
    }
    if (membership.role === 'President') {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: '#ef4444' }]} onPress={handleLeave}>
          <Text style={styles.joinButtonText}>Leave Club</Text>
        </TouchableOpacity>
      );
    }
    if (membership.role === 'Member') {
      return (
        <TouchableOpacity style={[styles.joinButton, { backgroundColor: '#ef4444' }]} onPress={handleLeave}>
          <Text style={styles.joinButtonText}>Leave Club</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          {membership?.role === 'President' && (
            <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('ClubAdmin' as never, { clubId, clubName: club.name } as never)}>
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
          <Image source={normalizeImage(club.image)} style={styles.clubImage} resizeMode="contain" />
          <View style={styles.headerOverlay}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>{club.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.shortDescription}>{club.shortDescription}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{club.members}</Text>
              <Text style={styles.statLabel}>Members</Text>
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
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{club.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Details</Text>
            <View style={styles.meetingCard}>
              <View style={styles.meetingRow}>
                <Text style={styles.meetingIcon}>📅</Text>
                <Text style={styles.meetingText}>{club.meetingTime}</Text>
              </View>
              <View style={styles.meetingRow}>
                <Text style={styles.meetingIcon}>📍</Text>
                <Text style={styles.meetingText}>{club.meetingLocation}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Club Leaders</Text>
            {club.leaders.map((leader, index) => (
              <View key={index} style={styles.leaderCard}>
                <View style={styles.leaderAvatar}>
                  <Text style={styles.leaderInitial}>{leader.name.charAt(0)}</Text>
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{leader.name}</Text>
                  <Text style={styles.leaderRole}>{leader.role}</Text>
                  <Text style={styles.leaderEmail}>{leader.email}</Text>
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
});
