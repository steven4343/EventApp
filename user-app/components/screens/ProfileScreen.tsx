import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { LoginScreen } from '../screens/LoginScreen';
import { Avatar } from '../ui/Avatar';
import { AppModal } from '../ui/AppModal';
import { Button } from '../ui/Button';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();
  const ph = horizontalPadding(r);
  const isDesktop = r.width >= 900;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) {
    return <LoginScreen onCancel={() => navigation.getParent()?.navigate('EventsTab')} />;
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const menuSections = [
    {
      items: [
        { icon: '🎫', label: t('profile.myTickets'), onPress: () => navigation.navigate('MyTickets') },
        { icon: '❤️', label: t('profile.savedEvents'), onPress: () => navigation.navigate('SavedEvents') },
        { icon: '🏠', label: t('profile.myClubs'), onPress: () => navigation.navigate('MyClubs') },
        { icon: '⭐', label: t('profile.myReviews'), onPress: () => navigation.navigate('MyReviews') },
      ],
    },
    {
      items: [
        { icon: '⚙️', label: t('profile.settings'), onPress: () => navigation.navigate('Settings') },
        { icon: '❓', label: t('profile.helpSupport'), onPress: () => navigation.navigate('HelpSupport') },
        { icon: '🚪', label: t('profile.logOut'), onPress: () => setShowLogoutConfirm(true), danger: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: ph, paddingTop: spacing.md }}>
          <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>{t('profile.myProfile')}</Text>
        </View>

        {/* Profile Card */}
        <View
          style={[
            shadow.md,
            {
              marginHorizontal: ph,
              backgroundColor: colors.card,
              borderRadius: radius.xl,
              padding: spacing.xl,
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Avatar
            uri={user.avatar || 'https://picsum.photos/seed/user/200'}
            name={user.name || 'U'}
            size={isDesktop ? 96 : 80}
          />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}>{user.name || t('profile.guest')}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{user.email}</Text>
          {user.faculty && (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {user.faculty} · {t('profile.year')} {user.year || t('profile.na')}
            </Text>
          )}
          {user.studentId && (
            <Text style={[typography.caption, { color: colors.textMuted }]}>{user.studentId}</Text>
          )}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View
            key={sIdx}
            style={[
              shadow.sm,
              {
                marginHorizontal: ph,
                backgroundColor: colors.card,
                borderRadius: radius.xl,
                overflow: 'hidden',
                marginBottom: spacing.lg,
              },
            ]}
          >
            {section.items.map((item, iIdx) => (
              <TouchableOpacity
                key={iIdx}
                onPress={item.onPress}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.lg,
                  borderBottomWidth: iIdx < section.items.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  gap: spacing.md,
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Text style={[typography.label, { flex: 1, color: item.danger ? colors.danger : colors.text }]}>
                  {item.label}
                </Text>
                <Text style={[typography.body, { color: colors.textMuted }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxxl }]}>
          {t('profile.version')}
        </Text>
      </ScrollView>

      <AppModal visible={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title={t('profile.logOut')} size="sm">
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
          {t('profile.areYouSureLogout')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button variant="outline" onPress={() => setShowLogoutConfirm(false)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="danger" onPress={handleLogout} style={{ flex: 1 }}>
            {t('profile.logOut')}
          </Button>
        </View>
      </AppModal>
    </SafeAreaView>
  );
}
