import React, { useState, useEffect } from 'react';
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

import { useAuth } from '../../context/AuthContext';
import { signInWithGoogle } from '../../services/googleAuth';

interface LoginScreenProps {
  onCancel?: () => void;
}

export function LoginScreen({ onCancel }: LoginScreenProps) {
  const { login, register: authRegister, googleSignIn } = useAuth();

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
        Alert.alert('Sign-In Cancelled', 'Google sign-in was cancelled or failed. Please try again.');
        setLoading(false);
        return;
      }
      const success = await googleSignIn(idToken);
      if (success) {
        onCancel?.();
      } else {
        Alert.alert('Error', 'Google sign-in failed. Please try again.');
      }
    } catch (e) {
      console.error('Google sign-in error:', e);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password');
      } else {
        onCancel?.();
      }
    } catch (e) {
      console.error('Login error:', e);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
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
        Alert.alert('Registration Failed', 'Something went wrong. Try again.');
      } else {
        onCancel?.();
      }
    } catch (e) {
      console.error('Registration error:', e);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!showEmailForm) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>🎓</Text>
            <Text style={styles.title}>CUZ Events</Text>
            <Text style={styles.subtitle}>Welcome to the campus hub</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              ) : (
                <Text style={styles.googleIcon}>G</Text>
              )}
              <Text style={styles.googleButtonText}>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => setShowEmailForm(true)}
            >
              <Text style={styles.emailButtonText}>Login with Email</Text>
            </TouchableOpacity>

            {onCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelText}>Continue as guest</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={styles.title}>CUZ Events</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        <View style={styles.form}>
          {isRegister && (
            <>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Student ID</Text>
              <TextInput
                style={styles.input}
                placeholder="CUZ/2024/001"
                value={studentId}
                onChangeText={setStudentId}
              />

              <Text style={styles.label}>Faculty</Text>
              <TextInput
                style={styles.input}
                placeholder="Business"
                value={faculty}
                onChangeText={setFaculty}
              />

              <Text style={styles.label}>Year of Study</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
              />
            </>
          )}

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="student@cavendish.co.zm"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Log In'}
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
            <Text style={styles.toggleText}>
              {isRegister
                ? 'Already have an account? Log in'
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowEmailForm(false)}
          >
            <Text style={styles.backText}>Back to all sign-in options</Text>
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
    fontSize: 64,
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
