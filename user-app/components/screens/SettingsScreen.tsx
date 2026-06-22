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
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { languages } from '../../i18n';
import { SettingsStackParamList } from '../../types/navigation';

const NOTIFICATIONS_KEY = 'cuz_events_notifications';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { user, logout } = useAuth();
  const { isDark, toggleDark, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then(v => { if (v) setNotifications(v === 'true'); });
  }, []);

  const toggleNotifications = async (val: boolean) => {
    setNotifications(val);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, val.toString());
  };

  const changeLanguage = async (lang: string) => {
    await setLanguage(lang);
    setShowLanguagePicker(false);
    Alert.alert(t('common.done'), t('settings.selectLanguage'));
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
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

  const langLabel = languages.find(l => l.code === language)?.native || language;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.headerText }]}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('settings.title')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings.account')}</Text>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.menuIcon}>✏️</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.editProfile')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.editProfileSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('ChangePassword')}>
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.changePassword')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.changePasswordSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setShowLogoutConfirm(true)}>
            <Text style={styles.menuIcon}>🚪</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.logOut')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.logOutSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings.preferences')}</Text>
          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.menuIcon}>🌙</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.darkMode')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.darkModeSub')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : colors.inputBg}
            />
          </View>

          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.notifications')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.notificationsSub')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notifications ? colors.primary : colors.inputBg}
            />
          </View>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setShowLanguagePicker(true)}>
            <Text style={styles.menuIcon}>🌐</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.language')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{langLabel}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings.privacy')}</Text>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => Alert.alert(t('settings.manageData'), t('settings.manageDataSub'))}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.manageData')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.manageDataSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => Linking.openURL('https://cuzevents.com/privacy')}>
            <Text style={styles.menuIcon}>📄</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.privacyPolicy')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.privacyPolicySub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleDeleteAccount}>
            <Text style={styles.menuIcon}>🗑️</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.danger }]}>{t('settings.deleteAccount')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.deleteAccountSub')}</Text>
            </View>
            <Text style={[styles.menuArrow, { color: colors.danger }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings.app')}</Text>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setShowAbout(true)}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.aboutApp')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.aboutAppSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => Linking.openURL('https://cuzevents.com/terms')}>
            <Text style={styles.menuIcon}>📋</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.termsOfService')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.termsOfServiceSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.menuIcon}>❓</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.helpSupport')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>{t('settings.helpSupportSub')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showLanguagePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.selectLanguage')}</Text>
            {languages.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langOption, { borderBottomColor: colors.border }, language === l.code && { backgroundColor: colors.primaryLight }]}
                onPress={() => changeLanguage(l.code)}
              >
                <Text style={[styles.langOptionText, { color: colors.text }, language === l.code && { color: colors.primary, fontWeight: '600' }]}>
                  {l.native}
                </Text>
                {language === l.code && <Text style={[styles.langCheck, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: colors.inputBg }]} onPress={() => setShowLanguagePicker(false)}>
              <Text style={[styles.modalCloseText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.aboutApp')}</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>{t('profile.version')}</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginTop: 12 }}>
              {t('app.tagline')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 22, marginTop: 12 }}>
              {'\u00A9'} 2026 Cavendish University Zambia.
            </Text>
            <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: colors.inputBg }]} onPress={() => setShowAbout(false)}>
              <Text style={[styles.modalCloseText, { color: colors.textMuted }]}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLogoutConfirm} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={[styles.logoutModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.logoutTitle, { color: colors.text }]}>{t('profile.logOut')}</Text>
            <Text style={[styles.logoutMessage, { color: colors.textSecondary }]}>{t('profile.areYouSureLogout')}</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity style={[styles.logoutCancelBtn, { backgroundColor: colors.inputBg }]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={[styles.logoutCancelText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutConfirmBtn, { backgroundColor: colors.danger }]} onPress={handleLogout}>
                <Text style={[styles.logoutConfirmText, { color: '#fff' }]}>{t('profile.logOut')}</Text>
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
  logoutModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    marginHorizontal: 'auto',
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
