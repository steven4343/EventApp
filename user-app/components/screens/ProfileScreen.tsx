import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { LoginScreen } from '../screens/LoginScreen';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, logout } = useAuth();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) {
    return <LoginScreen onCancel={() => navigation.getParent()?.navigate('EventsTab')} />;
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('profile.myProfile')}</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: user.avatar || 'https://picsum.photos/seed/user/200' }}
            style={[styles.avatar, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.name, { color: colors.text }]}>{user.name || t('profile.guest')}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
          {user.faculty ? <Text style={[styles.faculty, { color: colors.textMuted }]}>{user.faculty} • {t('profile.year')} {user.year || t('profile.na')}</Text> : null}
          {user.studentId ? <Text style={[styles.faculty, { color: colors.textMuted }]}>{user.studentId}</Text> : null}
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('MyTickets')}>
            <Text style={styles.menuIcon}>🎫</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.myTickets')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('SavedEvents')}>
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.savedEvents')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('MyClubs')}>
            <Text style={styles.menuIcon}>🏠</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.myClubs')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('MyReviews')}>
            <Text style={styles.menuIcon}>⭐</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.myReviews')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.settings')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.helpSupport')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setShowLogoutConfirm(true)}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.logOut')}</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: colors.textMuted }]}>{t('profile.version')}</Text>
      </ScrollView>

      <Modal visible={showLogoutConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.logoutModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.logoutTitle, { color: colors.text }]}>{t('profile.logOut')}</Text>
            <Text style={[styles.logoutMessage, { color: colors.textSecondary }]}>{t('profile.areYouSureLogout')}</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity style={[styles.logoutCancelBtn, { backgroundColor: colors.border }]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={[styles.logoutCancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutConfirmBtn, { backgroundColor: colors.danger }]} onPress={handleLogout}>
                <Text style={[styles.logoutConfirmText, { color: colors.headerText }]}>{t('profile.logOut')}</Text>
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
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileCard: {
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
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  faculty: {
    fontSize: 13,
  },
  menuSection: {
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
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 20,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModal: {
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 15,
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
  },
  logoutCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
