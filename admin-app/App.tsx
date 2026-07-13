import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AdminTabBar, type AdminTabKey } from './components/navigation/AdminTabBar';
import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import DashboardScreen from './components/screens/DashboardScreen';
import EventsManagementScreen from './components/screens/EventsManagementScreen';
import ClubsManagementScreen from './components/screens/ClubsManagementScreen';
import VerifyScreen from './components/screens/VerifyScreen';
import PaymentsManagementScreen from './components/screens/PaymentsManagementScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { adminApi } from './api';
import { connectSocket, disconnectSocket } from './services/socket';
import { addNotification } from './utils/notificationStore';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

function AdminApp() {
  const [admin, setAdmin] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabKey>('Dashboard');
  const { colors } = useTheme();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef<number>(Date.now());

  const clearTimers = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  };

  const doLogout = useCallback(() => {
    clearTimers();
    adminApi.logout();
    setAdmin(null);
    disconnectSocket();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!admin) return;
    lastActivity.current = Date.now();
    clearTimers();
    warningTimer.current = setTimeout(() => {
      Alert.alert('Session Expiring', 'Your session will expire in 1 minute due to inactivity.', [{ text: 'OK' }]);
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE);
    inactivityTimer.current = setTimeout(() => {
      doLogout();
      Alert.alert('Session Expired', 'Please login again.');
    }, SESSION_TIMEOUT_MS);
  }, [admin, doLogout]);

  useEffect(() => {
    (async () => {
      await adminApi.init();
      adminApi.onUnauthorized = doLogout;
      const currentAdmin = adminApi.getCurrentAdmin();
      if (currentAdmin) {
        setAdmin(currentAdmin);
        if (currentAdmin.id) connectSocket(currentAdmin.id);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (admin) resetInactivityTimer();
  }, [admin, resetInactivityTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && admin) {
        const elapsed = Date.now() - lastActivity.current;
        if (elapsed >= SESSION_TIMEOUT_MS) {
          doLogout();
          Alert.alert('Session Expired', 'Your session has expired due to inactivity.');
        } else {
          resetInactivityTimer();
        }
      }
    });
    return () => subscription.remove();
  }, [admin, resetInactivityTimer, doLogout]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!admin) return;
    const checkNewEvents = async () => {
      try {
        const events = await adminApi.getEvents('Published');
        for (const event of events) {
          if (notifiedIds.current.has(event.id)) continue;
          notifiedIds.current.add(event.id);
          await addNotification({
            id: `notif_${event.id}_${Date.now()}`,
            title: 'New Event Posted',
            body: event.title,
            timestamp: new Date().toISOString(),
            read: false,
            eventId: event.id,
          });
        }
      } catch {}
    };
    checkNewEvents();
    pollingRef.current = setInterval(checkNewEvents, 60000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [admin]);

  const handleLogin = (loggedInAdmin: any) => {
    setAdmin(loggedInAdmin);
    if (loggedInAdmin?.id) connectSocket(loggedInAdmin.id);
    resetInactivityTimer();
  };

  const handleLogout = () => {
    clearTimers();
    adminApi.logout();
    setAdmin(null);
    disconnectSocket();
    setActiveTab('Dashboard');
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardScreen />;
      case 'Events': return <EventsManagementScreen />;
      case 'Clubs': return <ClubsManagementScreen />;
      case 'Verify': return <VerifyScreen />;
      case 'Payments': return <PaymentsManagementScreen />;
      case 'Settings': return <SettingsScreen admin={admin} onLogout={handleLogout} />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AdminTabBar active={activeTab} onSelect={setActiveTab} />
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [admin, setAdmin] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      await adminApi.init();
      const currentAdmin = adminApi.getCurrentAdmin();
      setAdmin(currentAdmin);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!admin) {
    return <AdminLoginScreen onLogin={(user: any) => setAdmin(user)} />;
  }

  return <AdminApp />;
}
