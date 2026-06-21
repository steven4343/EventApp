import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

interface LoginScreenProps {
  onCancel?: () => void;
}

export function LoginScreen({ onCancel }: LoginScreenProps) {
  const { login, register: authRegister, googleSignIn } = useAuth();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();

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
      console.log('handleGoogleSignIn: starting');
      const idToken = await signInWithGoogle();
      console.log('handleGoogleSignIn: got idToken', !!idToken);
      if (!idToken) {
        Alert.alert(t('login.error'), t('login.cancelled'));
        setLoading(false);
        return;
      }
      const success = await googleSignIn(idToken);
      console.log('handleGoogleSignIn: googleSignIn success', success);
      if (success) {
        console.log('handleGoogleSignIn: calling onCancel');
        onCancel?.();
      } else {
        Alert.alert(t('login.error'), t('login.googleSignInFailed'));
      }
    } catch (e) {
      console.error('Google sign-in error:', e);
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
      console.error('Login error:', e);
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
        name,
        email,
        studentId,
        password,
        faculty,
        year: parseInt(year) || 1,
      });
      if (!success) {
        Alert.alert(t('login.registrationFailed'), t('login.somethingWentWrong'));
      } else {
        onCancel?.();
      }
    } catch (e) {
      console.error('Registration error:', e);
      Alert.alert(t('login.error'), t('login.failedToConnect'));
    } finally {
      setLoading(false);
    }
  };

  if (!showEmailForm) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={require('../../assets/cuz-logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: colors.text }]}>CUZ Events</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('login.welcome')}</Text>
          </View>

          <View style={[styles.form, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.googleButton, loading && styles.buttonDisabled, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginRight: 10 }} />
              ) : (
                <Text style={[styles.googleIcon, { backgroundColor: colors.border }]}>G</Text>
              )}
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                {loading ? t('login.signingIn') : t('login.continueWithGoogle')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.emailButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowEmailForm(true)}
            >
              <Text style={[styles.emailButtonText, { color: colors.headerText }]}>{t('login.loginWithEmail')}</Text>
            </TouchableOpacity>

            {onCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('login.continueAsGuest')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={require('../../assets/cuz-logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: colors.text }]}>CUZ Events</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isRegister ? t('login.createAccount') : t('login.welcomeBack')}
            </Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card }]}>
          {isRegister && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('login.fullName')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="John Doe"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('login.studentId')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="CUZ/2024/001"
                placeholderTextColor={colors.textMuted}
                value={studentId}
                onChangeText={setStudentId}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('login.faculty')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Business"
                placeholderTextColor={colors.textMuted}
                value={faculty}
                onChangeText={setFaculty}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('login.yearOfStudy')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.text }]}>{t('login.email')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="student@cavendish.co.zm"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('login.password')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={t('login.enterPassword')}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled, { backgroundColor: colors.primary }]}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.headerText }]}>
              {loading ? t('login.pleaseWait') : isRegister ? t('login.createAccount') : t('login.logIn')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsRegister(!isRegister);
              setEmail('');
              setPassword('');
              setName('');
              setStudentId('');
              setFaculty('');
              setYear('1');
            }}
          >
            <Text style={[styles.toggleText, { color: colors.primary }]}>
              {isRegister
                ? t('login.alreadyHaveAccount')
                : t('login.noAccount')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowEmailForm(false)}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{t('login.backToOptions')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
    marginRight: 10,
    backgroundColor: '#f1f5f9',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emailButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
  },
  cancelText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
  },
  backText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
});
