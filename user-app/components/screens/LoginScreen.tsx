import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signInWithGoogle } from '../../services/googleAuth';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useResponsive } from '../../theme/responsive';
import { typography, spacing, radius, shadow } from '../../theme/tokens';
import { Button } from '../ui/Button';

interface LoginScreenProps {
  onCancel?: () => void;
}

export function LoginScreen({ onCancel }: LoginScreenProps) {
  const { login, register: authRegister, googleSignIn } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const r = useResponsive();
  const isDesktop = r.width >= 900;

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [year, setYear] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) {
        if (Platform.OS === 'web') return;
        Alert.alert(t('login.error'), t('login.cancelled'));
        setLoading(false);
        return;
      }
      const success = await googleSignIn(idToken);
      if (success) {
        onCancel?.();
      } else {
        Alert.alert(t('login.error'), t('login.googleSignInFailed'));
      }
    } catch (e) {
      Alert.alert(t('login.error'), t('login.googleSignInFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('login.error'), t('login.pleaseEnterEmailAndPassword'));
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert(t('login.loginFailed'), t('login.invalidCredentials'));
      } else {
        onCancel?.();
      }
    } catch (e) {
      Alert.alert(t('login.error'), t('login.failedToConnect'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert(t('login.error'), t('login.pleaseFillFields'));
      return;
    }
    setLoading(true);
    try {
      const success = await authRegister({
        name, email, studentId, password, faculty, year: parseInt(year) || 1,
      });
      if (!success) {
        Alert.alert(t('login.registrationFailed'), t('login.somethingWentWrong'));
      } else {
        onCancel?.();
      }
    } catch (e) {
      Alert.alert(t('login.error'), t('login.failedToConnect'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (extra?: any) => ({
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    backgroundColor: colors.inputBg,
    color: colors.text,
    ...extra,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: isDesktop ? spacing.xxxl : spacing.xl,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xxxl }}>
          <Image
            source={require('../../assets/cuz-logo.png')}
            style={{ width: isDesktop ? 80 : 64, height: isDesktop ? 80 : 64, marginBottom: spacing.lg, borderRadius: radius.lg }}
            resizeMode="contain"
          />
          <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.sm }]}>CUZ Events</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>
            {!showEmailForm ? t('login.welcome') : isRegister ? t('login.createAccount') : t('login.welcomeBack')}
          </Text>
        </View>

        <View
          style={[
            shadow.lg,
            {
              backgroundColor: colors.card,
              borderRadius: radius.xxl,
              padding: isDesktop ? spacing.xxxl : spacing.xl,
              maxWidth: isDesktop ? 440 : undefined,
              alignSelf: isDesktop ? 'center' : undefined,
              width: '100%',
            },
          ]}
        >
          {!showEmailForm ? (
            <>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.card,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: spacing.md,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginRight: spacing.md }} />
                ) : (
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
                    marginRight: spacing.md,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#4285F4' }}>G</Text>
                  </View>
                )}
                <Text style={[typography.label, { color: colors.text }]}>
                  {loading ? t('login.signingIn') : t('login.continueWithGoogle')}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={[typography.caption, { marginHorizontal: spacing.md, color: colors.textMuted }]}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>

              <Button
                variant="primary"
                onPress={() => setShowEmailForm(true)}
                fullWidth
                size="lg"
              >
                {t('login.loginWithEmail')}
              </Button>

              {onCancel && (
                <TouchableOpacity onPress={onCancel} style={{ alignItems: 'center', marginTop: spacing.lg, padding: spacing.md }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{t('login.continueAsGuest')}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {isRegister && (
                <>
                  <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>{t('login.fullName')}</Text>
                  <TextInput style={inputStyle()} placeholder="John Doe" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} autoCapitalize="words" />

                  <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>{t('login.studentId')}</Text>
                  <TextInput style={inputStyle()} placeholder="CUZ/2024/001" placeholderTextColor={colors.textMuted} value={studentId} onChangeText={setStudentId} />

                  <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>{t('login.faculty')}</Text>
                  <TextInput style={inputStyle()} placeholder="Business" placeholderTextColor={colors.textMuted} value={faculty} onChangeText={setFaculty} />

                  <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>{t('login.yearOfStudy')}</Text>
                  <TextInput style={inputStyle()} placeholder="1" placeholderTextColor={colors.textMuted} value={year} onChangeText={setYear} keyboardType="number-pad" />
                </>
              )}

              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>{t('login.email')}</Text>
              <TextInput style={inputStyle()} placeholder="student@cavendish.co.zm" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md }]}>{t('login.password')}</Text>
              <TextInput style={inputStyle()} placeholder={t('login.enterPassword')} placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

              <View style={{ marginTop: spacing.xl }}>
                <Button
                  variant="primary"
                  onPress={isRegister ? handleRegister : handleLogin}
                  loading={loading}
                  fullWidth
                  size="lg"
                >
                  {loading ? t('login.pleaseWait') : isRegister ? t('login.createAccount') : t('login.logIn')}
                </Button>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setIsRegister(!isRegister);
                  setEmail(''); setPassword(''); setName(''); setStudentId(''); setFaculty(''); setYear('1');
                }}
                style={{ alignItems: 'center', marginTop: spacing.lg }}
              >
                <Text style={[typography.body, { color: colors.primary }]}>
                  {isRegister ? t('login.alreadyHaveAccount') : t('login.noAccount')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowEmailForm(false)} style={{ alignItems: 'center', marginTop: spacing.md, padding: spacing.md }}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{t('login.backToOptions')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
