import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const FACULTIES = [
  'Business',
  'Information Technology',
  'Law',
  'Education',
  'Health Sciences',
  'Communications',
  'Engineering',
  'Other',
];

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [year, setYear] = useState(user?.year?.toString() || '1');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setAvatar(`data:image/jpeg;base64,${base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('login.error'), t('editProfile.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        faculty: faculty || undefined,
        year: year ? parseInt(year) : 1,
        avatar: avatar || undefined,
      });
      Alert.alert(t('editProfile.success'), t('editProfile.profileUpdated'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('login.error'), t('editProfile.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.headerText }]}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('editProfile.title')}</Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={
                avatar
                  ? { uri: avatar }
                  : { uri: 'https://picsum.photos/seed/user/200' }
              }
              style={[styles.avatar, { backgroundColor: colors.border }]}
            />
            <View style={[styles.avatarOverlay, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarOverlayText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>{t('editProfile.tapToChange')}</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('editProfile.fullName')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder={t('editProfile.yourFullName')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('editProfile.faculty')}</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={() => setShowFacultyPicker(!showFacultyPicker)}
          >
            <Text style={faculty ? [styles.inputText, { color: colors.text }] : [styles.placeholderText, { color: colors.textMuted }]}>
              {faculty || t('editProfile.selectFaculty')}
            </Text>
          </TouchableOpacity>

          {showFacultyPicker && (
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {FACULTIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    faculty === f && [styles.pickerOptionSelected, { backgroundColor: colors.primaryLight }],
                  ]}
                  onPress={() => {
                    setFaculty(f);
                    setShowFacultyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: colors.text },
                      faculty === f && [styles.pickerOptionTextSelected, { color: colors.primary }],
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>{t('editProfile.yearOfStudy')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            value={year}
            onChangeText={setYear}
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.headerText} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.headerText }]}>{t('editProfile.saveChanges')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlayText: {
    fontSize: 18,
  },
  avatarHint: {
    fontSize: 13,
    marginTop: 8,
  },
  form: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
  },
  pickerOptionSelected: {
  },
  pickerOptionText: {
    fontSize: 15,
  },
  pickerOptionTextSelected: {
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
