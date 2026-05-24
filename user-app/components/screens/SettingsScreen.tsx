import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { SettingsStackParamList } from '../../types/navigation';

const DARK_MODE_KEY = 'cuz_events_dark_mode';
const NOTIFICATIONS_KEY = 'cuz_events_notifications';
const LANGUAGE_KEY = 'cuz_events_language';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then(v => { if (v) setDarkMode(v === 'true'); });
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then(v => { if (v) setNotifications(v === 'true'); });
    AsyncStorage.getItem(LANGUAGE_KEY).then(v => { if (v) setLanguage(v); });
  }, []);

  const toggleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    await AsyncStorage.setItem(DARK_MODE_KEY, val.toString());
  };

  const toggleNotifications = async (val: boolean) => {
    setNotifications(val);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, val.toString());
  };

  const changeLanguage = async (lang: string) => {
    setLanguage(lang);
    setShowLanguagePicker(false);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    Alert.alert('Language', `App language set to ${lang}. Restart to apply.`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); } },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            logout();
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Edit Profile</Text>
              <Text style={styles.menuSubtext}>Name, faculty, profile picture</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Change Password</Text>
              <Text style={styles.menuSubtext}>Update your password</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Log Out</Text>
              <Text style={styles.menuSubtext}>Sign out of your account</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>🌙</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Dark Mode</Text>
              <Text style={styles.menuSubtext}>Toggle dark theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
              thumbColor={darkMode ? '#2563eb' : '#f8fafc'}
            />
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Notifications</Text>
              <Text style={styles.menuSubtext}>Event reminders and updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
              thumbColor={notifications ? '#2563eb' : '#f8fafc'}
            />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguagePicker(true)}>
            <Text style={styles.menuIcon}>🌐</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Language</Text>
              <Text style={styles.menuSubtext}>{language}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert(
            'Manage Data',
            'You can request a copy of your data or delete your account by contacting support. Your data is stored securely and used only for app functionality.',
          )}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Manage Data</Text>
              <Text style={styles.menuSubtext}>Control your data</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://cuzevents.com/privacy')}>
            <Text style={styles.menuIcon}>📄</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Privacy Policy</Text>
              <Text style={styles.menuSubtext}>Read our privacy policy</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Text style={styles.menuIcon}>🗑️</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, styles.deleteText]}>Delete Account</Text>
              <Text style={styles.menuSubtext}>Permanently remove your account</Text>
            </View>
            <Text style={[styles.menuArrow, styles.deleteArrow]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowAbout(true)}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>About App</Text>
              <Text style={styles.menuSubtext}>CUZ Events v1.0.0</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://cuzevents.com/terms')}>
            <Text style={styles.menuIcon}>📋</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Terms of Service</Text>
              <Text style={styles.menuSubtext}>Read our terms</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.menuIcon}>❓</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Help & Support</Text>
              <Text style={styles.menuSubtext}>FAQ, contact support</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showLanguagePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {['English', 'French', 'Portuguese', 'Swahili'].map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langOption, language === lang && styles.langOptionSelected]}
                onPress={() => changeLanguage(lang)}
              >
                <Text style={[styles.langOptionText, language === lang && styles.langOptionTextSelected]}>
                  {lang}
                </Text>
                {language === lang && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowLanguagePicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About CUZ Events</Text>
            <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 8 }}>Version 1.0.0</Text>
            <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 12 }}>
              CUZ Events is your campus companion for discovering and managing university events and clubs at Cavendish University Zambia.
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 22, marginTop: 12 }}>
              {'\u00A9'} 2026 Cavendish University Zambia. All rights reserved.
            </Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAbout(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
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
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  menuSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: '#cbd5e1',
    marginLeft: 8,
  },
  deleteText: {
    color: '#ef4444',
  },
  deleteArrow: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderRadius: 12,
  },
  langOptionSelected: {
    backgroundColor: '#dbeafe',
  },
  langOptionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  langOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  langCheck: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});
