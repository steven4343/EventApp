import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { adminApi } from '../../api';
import { ScreenHeader } from '../ui/ScreenHeader';
import * as ImagePicker from 'expo-image-picker';

interface SettingsScreenProps {
  admin: any;
  onLogout: () => void;
}

export function SettingsScreen({ admin, onLogout }: SettingsScreenProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const px = horizontalPadding(r);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [editName, setEditName] = useState(admin?.name || '');
  const [editEmail, setEditEmail] = useState(admin?.email || '');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const updates: any = { name: editName.trim(), email: editEmail.trim() };
      if (editAvatar) updates.avatar = editAvatar;
      const updated = await adminApi.updateUser(admin.id, updates);
      if (updated) {
        admin.name = updated.name;
        admin.email = updated.email;
        admin.avatar = updated.avatar;
      }
      await adminApi.persistCurrentAdmin();
      Alert.alert('Success', 'Profile updated');
      setShowEditModal(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setEditAvatar(`data:${asset.mimeType};base64,${asset.base64}`);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setEditAvatar(`data:${asset.mimeType};base64,${asset.base64}`);
      }
    }
  };

  const contentStyle = r.isDesktop
    ? { maxWidth: 600, alignSelf: 'center' as const, width: '100%' as const }
    : {};

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[s.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" subtitle="Admin configuration" />

        <View style={{ paddingHorizontal: px, marginTop: 16 }}>
          {admin && (
            <View style={[s.profileCard, { backgroundColor: colors.card }]}>
              {admin.avatar ? (
                <Image source={{ uri: admin.avatar }} style={s.avatarImage} />
              ) : (
                <View style={[s.avatarCircle, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[s.avatarInitials, { color: colors.primary }]}>
                    {getInitials(admin.name)}
                  </Text>
                </View>
              )}
              <Text style={[s.profileName, { color: colors.text }]}>{admin.name}</Text>
              <Text style={[s.profileEmail, { color: colors.textSecondary }]}>{admin.email}</Text>
              <View style={[s.roleBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[s.roleText, { color: colors.primary }]}>Administrator</Text>
              </View>
            </View>
          )}

          <View style={s.group}>
            <Text style={[s.groupTitle, { color: colors.textMuted }]}>Profile</Text>
            <TouchableOpacity
              style={[s.settingsItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setEditName(admin?.name || '');
                setEditEmail(admin?.email || '');
                setEditAvatar('');
                setShowEditModal(true);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.itemLabel, { color: colors.text }]}>Edit Profile</Text>
                <Text style={[s.itemSub, { color: colors.textMuted }]}>Update name and email</Text>
              </View>
              <Text style={[s.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={s.group}>
            <Text style={[s.groupTitle, { color: colors.textMuted }]}>App</Text>
            <TouchableOpacity
              style={[s.settingsItem, { backgroundColor: colors.card }]}
              onPress={() => setShowAbout(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.itemLabel, { color: colors.text }]}>About App</Text>
                <Text style={[s.itemSub, { color: colors.textMuted }]}>CUZ Events Admin v1.0.0</Text>
              </View>
              <Text style={[s.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.settingsItem, { backgroundColor: colors.card }]}
              onPress={() => Linking.openURL('https://cuzevents.com/privacy')}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.itemLabel, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[s.itemSub, { color: colors.textMuted }]}>Read our privacy policy</Text>
              </View>
              <Text style={[s.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.settingsItem, { backgroundColor: colors.card }]}
              onPress={() => Linking.openURL('https://cuzevents.com/terms')}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.itemLabel, { color: colors.text }]}>Terms of Service</Text>
                <Text style={[s.itemSub, { color: colors.textMuted }]}>Read our terms</Text>
              </View>
              <Text style={[s.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={s.group}>
            <Text style={[s.groupTitle, { color: colors.textMuted }]}>Account</Text>
            <TouchableOpacity
              style={[s.settingsItem, { backgroundColor: colors.card }]}
              onPress={onLogout}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.itemLabel, { color: colors.danger }]}>Log Out</Text>
                <Text style={[s.itemSub, { color: colors.textMuted }]}>Sign out of admin account</Text>
              </View>
              <Text style={[s.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>About CUZ Events Admin</Text>
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>Version 1.0.0</Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginTop: 12 }}>
                Admin management app for CUZ Events. Manage events, clubs, payments, and users.
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginTop: 12 }}>
                Developed by the CUZ IT Department.
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 22, marginTop: 12 }}>
                {'\u00A9'} 2026 Cavendish University Zambia. All rights reserved.
              </Text>
            </View>
            <TouchableOpacity style={[s.cancelBtn, { backgroundColor: colors.surface }]} onPress={() => setShowAbout(false)}>
              <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <ScrollView style={[s.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <View style={s.avatarSection}>
              <Image
                source={{ uri: editAvatar || admin?.avatar || 'https://picsum.photos/seed/admin/200' }}
                style={s.editAvatar}
              />
              <View style={s.editAvatarRow}>
                <TouchableOpacity style={[s.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickAvatar}>
                  <Text style={[s.imagePickerText, { color: colors.textSecondary }]}>Choose Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={takePhoto}>
                  <Text style={[s.imagePickerText, { color: colors.textSecondary }]}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[s.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[s.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />
            <View style={s.modalButtons}>
              <TouchableOpacity style={[s.cancelBtn, { backgroundColor: colors.surface }]} onPress={() => setShowEditModal(false)}>
                <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile} disabled={saving}>
                <Text style={s.submitBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  profileCard: { borderRadius: 20, padding: 20, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInitials: { fontSize: 28, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  profileEmail: { fontSize: 14, marginBottom: 4 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  roleText: { fontSize: 12, fontWeight: '600' },
  group: { marginBottom: 16 },
  groupTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemLabel: { fontSize: 15, fontWeight: '500' },
  itemSub: { fontSize: 13, marginTop: 2 },
  arrow: { fontSize: 20, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  editAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  editAvatarRow: { flexDirection: 'row', gap: 8 },
  imagePickerBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
  imagePickerText: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 20, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 20, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
