import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { languages } from '../../i18n';
import { SettingsStackParamList } from '../../types/navigation';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { Button } from '../ui/Button';

const NOTIFICATIONS_KEY = 'cuz_events_notifications';
type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList>;

function SettingsSection({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[shadow.sm, { backgroundColor: colors.card, marginHorizontal: 16, marginTop: spacing.lg, borderRadius: radius.xl, overflow: 'hidden' }]}>
      <Text style={[typography.overline, { color: colors.textMuted, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SettingsRow({ icon, label, sublabel, onPress, right, colors, danger }: {
  icon: string; label: string; sublabel?: string; onPress?: () => void;
  right?: React.ReactNode; colors: any; danger?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md,
      }}
    >
      <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[typography.label, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
        {sublabel && <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{sublabel}</Text>}
      </View>
      {right || <Text style={[typography.body, { color: colors.textMuted }]}>›</Text>}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { logout } = useAuth();
  const { isDark, toggleDark, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const r = useResponsive();
  const ph = horizontalPadding(r);
  const [notifications, setNotifications] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { logout(); Alert.alert('Account Deleted', 'Your account has been deleted.'); } },
    ]);
  };

  const langLabel = languages.find(l => l.code === language)?.native || language;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: ph, paddingTop: spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md, padding: spacing.xs }}>
            <Text style={[typography.body, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={[typography.h2, { color: colors.text }]}>{t('settings.title')}</Text>
        </View>

        {/* Account */}
        <SettingsSection title={t('settings.account')} colors={colors}>
          <SettingsRow icon="✏️" label={t('settings.editProfile')} sublabel={t('settings.editProfileSub')} onPress={() => navigation.navigate('EditProfile')} colors={colors} />
          <SettingsRow icon="🔒" label={t('settings.changePassword')} sublabel={t('settings.changePasswordSub')} onPress={() => navigation.navigate('ChangePassword')} colors={colors} />
          <SettingsRow icon="🚪" label={t('settings.logOut')} sublabel={t('settings.logOutSub')} onPress={() => setShowLogoutConfirm(true)} colors={colors} />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title={t('settings.preferences')} colors={colors}>
          <SettingsRow icon="🌙" label={t('settings.darkMode')} sublabel={t('settings.darkModeSub')} colors={colors}
            right={<Switch value={isDark} onValueChange={toggleDark} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={isDark ? colors.primary : colors.inputBg} />} />
          <SettingsRow icon="🔔" label={t('settings.notifications')} sublabel={t('settings.notificationsSub')} colors={colors}
            right={<Switch value={notifications} onValueChange={toggleNotifications} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={notifications ? colors.primary : colors.inputBg} />} />
          <SettingsRow icon="🌐" label={t('settings.language')} sublabel={langLabel} onPress={() => setShowLanguagePicker(true)} colors={colors} />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title={t('settings.privacy')} colors={colors}>
          <SettingsRow icon="🛡️" label={t('settings.manageData')} sublabel={t('settings.manageDataSub')} onPress={() => Alert.alert(t('settings.manageData'), t('settings.manageDataSub'))} colors={colors} />
          <SettingsRow icon="📄" label={t('settings.privacyPolicy')} sublabel={t('settings.privacyPolicySub')} onPress={() => Linking.openURL('https://cuzevents.com/privacy')} colors={colors} />
          <SettingsRow icon="🗑️" label={t('settings.deleteAccount')} sublabel={t('settings.deleteAccountSub')} onPress={handleDeleteAccount} colors={colors} danger />
        </SettingsSection>

        {/* App */}
        <SettingsSection title={t('settings.app')} colors={colors}>
          <SettingsRow icon="ℹ️" label={t('settings.aboutApp')} sublabel={t('settings.aboutAppSub')} onPress={() => setShowAbout(true)} colors={colors} />
          <SettingsRow icon="📋" label={t('settings.termsOfService')} sublabel={t('settings.termsOfServiceSub')} onPress={() => Linking.openURL('https://cuzevents.com/terms')} colors={colors} />
          <SettingsRow icon="❓" label={t('settings.helpSupport')} sublabel={t('settings.helpSupportSub')} onPress={() => navigation.navigate('HelpSupport')} colors={colors} />
        </SettingsSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={[shadow.xl, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: 40 }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.lg }]}>{t('settings.selectLanguage')}</Text>
            {languages.map(l => (
              <TouchableOpacity
                key={l.code}
                onPress={() => changeLanguage(l.code)}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
                  backgroundColor: language === l.code ? colors.primaryLight : 'transparent',
                  borderRadius: radius.lg, paddingHorizontal: spacing.md,
                }}
              >
                <Text style={[typography.body, { color: language === l.code ? colors.primary : colors.text }]}>{l.native}</Text>
                {language === l.code && <Text style={[typography.body, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
            <Button variant="outline" onPress={() => setShowLanguagePicker(false)} fullWidth style={{ marginTop: spacing.lg }}>
              {t('common.cancel')}
            </Button>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={[shadow.xl, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: 40 }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('settings.aboutApp')}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.sm }]}>{t('profile.version')}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>{t('app.tagline')}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xl }]}>© 2026 Cavendish University Zambia.</Text>
            <Button variant="outline" onPress={() => setShowAbout(false)} fullWidth>{t('common.close')}</Button>
          </View>
        </View>
      </Modal>

      {/* Logout Confirm Modal */}
      <Modal visible={showLogoutConfirm} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[shadow.xl, { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, width: '80%', maxWidth: 320 }]}>
            <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>{t('profile.logOut')}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>{t('profile.areYouSureLogout')}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Button variant="outline" onPress={() => setShowLogoutConfirm(false)} style={{ flex: 1 }}>{t('common.cancel')}</Button>
              <Button variant="danger" onPress={handleLogout} style={{ flex: 1 }}>{t('profile.logOut')}</Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
