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
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive, horizontalPadding } from '../../theme/responsive';
import { adminApi } from '../../api';
import { User } from '../../types';

interface AdminLoginScreenProps {
  onLogin: (user: any) => void;
}

export function AdminLoginScreen({ onLogin }: AdminLoginScreenProps) {
  const { colors } = useTheme();
  const r = useResponsive();
  const px = horizontalPadding(r);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const user = await adminApi.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials or not an admin account');
      }
    } catch {
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guest: User = {
      id: 'guest',
      name: 'Guest Admin',
      email: 'guest@cavendish.edu',
      password: '',
      studentId: '',
      faculty: '',
      year: 0,
      avatar: '',
      joinedAt: new Date().toISOString(),
      isActive: true,
      role: 'admin',
    };
    adminApi.setGuestAdmin(guest);
    onLogin(guest);
  };

  const formStyle = r.isDesktop
    ? { maxWidth: 420, alignSelf: 'center' as const, width: '100%' as const }
    : {};

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[s.scrollContent, formStyle]}>
        <View style={s.header}>
          <View style={[s.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={s.logo}>🛡️</Text>
          </View>
          <Text style={[s.title, { color: colors.text }]}>Admin Portal</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>CUZ Events Management</Text>
        </View>

        <View style={[s.form, { backgroundColor: colors.card }]}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Admin Email</Text>
          <TextInput
            style={[s.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
            placeholder="admin@cavendish.edu"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
          <TextInput
            style={[s.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.button, { backgroundColor: colors.primary }, loading && s.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[s.guestButton, { borderColor: colors.border }]} onPress={handleGuestLogin}>
            <Text style={[s.guestButtonText, { color: colors.textSecondary }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.footer, { color: colors.textMuted }]}>
          {'\u00A9'} 2026 Cavendish University Zambia
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logo: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 18 },
  form: { borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  button: { borderRadius: 20, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  guestButton: { borderRadius: 20, padding: 14, alignItems: 'center', marginTop: 12, borderWidth: 1 },
  guestButtonText: { fontSize: 16, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 32 },
});
