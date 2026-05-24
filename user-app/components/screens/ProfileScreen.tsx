import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) {
    return <LoginScreen onCancel={() => navigation.getParent()?.navigate('EventsTab')} />;
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <Image
            source={{ uri: user.avatar || 'https://picsum.photos/seed/user/200' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user.name || 'Guest'}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.faculty ? <Text style={styles.faculty}>{user.faculty} • Year {user.year || 'N/A'}</Text> : null}
          {user.studentId ? <Text style={styles.faculty}>{user.studentId}</Text> : null}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyTickets')}>
            <Text style={styles.menuIcon}>🎫</Text>
            <Text style={styles.menuLabel}>My Tickets</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SavedEvents')}>
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuLabel}>Saved Events</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyClubs')}>
            <Text style={styles.menuIcon}>🏠</Text>
            <Text style={styles.menuLabel}>My Clubs</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyReviews')}>
            <Text style={styles.menuIcon}>⭐</Text>
            <Text style={styles.menuLabel}>My Reviews</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuLabel}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLogoutConfirm(true)}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={styles.menuLabel}>Log Out</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      <Modal visible={showLogoutConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.logoutMessage}>Are you sure you want to log out?</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity style={styles.logoutCancelBtn} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmBtn} onPress={handleLogout}>
                <Text style={styles.logoutConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -40,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  faculty: {
    fontSize: 13,
    color: '#94a3b8',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  menuArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94a3b8',
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  logoutCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  logoutConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
