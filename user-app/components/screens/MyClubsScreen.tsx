import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { userApi } from '../../api';
import { Club } from '../../types';

interface UserClub {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  joinedAt: string;
}

interface UserClubWithDetails {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  joinedAt: string;
  club?: Club;
}

export function MyClubsScreen() {
  const navigation = useNavigation<any>();
  const [userClubs, setUserClubs] = useState<UserClubWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const data = await userApi.getUserClubs();
      setUserClubs(data);
    } catch (e) {
      console.error('Failed to load clubs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      await userApi.leaveClub(clubId);
      setUserClubs((prev) => prev.filter((uc) => uc.clubId !== clubId));
    } catch (e) {
      console.error('Failed to leave club:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (userClubs.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Clubs</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>Not a member of any clubs</Text>
            <Text style={styles.emptyText}>Join clubs to connect with fellow students and stay updated on events.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Clubs</Text>
        </View>

        <View style={styles.list}>
          {userClubs.map((uc) => {
            const club = uc.club;
            if (!club) return null;
            return (
              <View key={uc.id} style={styles.clubCard}>
                <TouchableOpacity
                  style={styles.clubInfo}
                  onPress={() => navigation.navigate('ClubsTab', { screen: 'ClubDetails', params: { clubId: club.id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.clubIcon}>
                    <Text style={styles.clubIconText}>🏠</Text>
                  </View>
                  <View style={styles.clubDetails}>
                    <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                    <Text style={styles.clubCategory}>{club.category}</Text>
                    <Text style={styles.clubMeta}>👥 {club.members} members • ⭐ {club.rating}</Text>
                    <Text style={styles.clubRole}>Role: {uc.role}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leaveButton} onPress={() => handleLeaveClub(club.id)}>
                  <Text style={styles.leaveText}>Leave</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  clubCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clubInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clubIconText: {
    fontSize: 24,
  },
  clubDetails: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  clubCategory: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  clubMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  clubRole: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 2,
  },
  leaveButton: {
    padding: 8,
    marginLeft: 8,
  },
  leaveText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
});
