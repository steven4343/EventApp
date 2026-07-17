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
import PendingEventsScreen from './components/screens/PendingEventsScreen';
import UserManagementScreen from './components/screens/UserManagementScreen';
import ParticipationReportsScreen from './components/screens/ParticipationReportsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { adminApi } from './api';
import { connectSocket, disconnectSocket, getSocket } from './services/socket';
import { addNotification, AppNotification } from './utils/notificationStore';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

function AdminApp() {
  const [admin, setAdmin] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabKey>('Dashboard');
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [notifTrigger, setNotifTrigger] = useState(0);
  const { colors } = useTheme();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef<number>(Date.now());

  const clearTimers = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  };

  const triggerDataRefresh = useCallback(() => {
    setDataRefreshKey(k => k + 1);
  }, []);

  const pushNotification = useCallback(async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    await addNotification({
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    });
    setNotifTrigger(t => t + 1);
  }, []);

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

  useEffect(() => {
    if (!admin?.id) return;

    const socket = connectSocket(admin.id);

    const onEventStatus = (data: { id: string; title: string; status: string; timestamp: string }) => {
      pushNotification({
        title: 'Event Status Changed',
        body: `"${data.title}" is now ${data.status}`,
        eventId: data.id,
      });
      triggerDataRefresh();
    };

    const onEventCreated = (data: { id: string; title: string; status: string }) => {
      pushNotification({
        title: 'New Event Created',
        body: data.title,
        eventId: data.id,
      });
      triggerDataRefresh();
    };

    const onClubCreated = (data: { id: string; name: string }) => {
      pushNotification({
        title: 'New Club Created',
        body: data.name,
      });
      triggerDataRefresh();
    };

    const onTicketVerified = (data: { ticketId: string; eventTitle: string }) => {
      pushNotification({
        title: 'Ticket Verified',
        body: `${data.eventTitle} - ticket scanned`,
      });
      triggerDataRefresh();
    };

    const onFeedbackSubmitted = (data: { eventId: string; eventTitle: string; rating: number }) => {
      pushNotification({
        title: 'New Feedback',
        body: `${data.eventTitle} - ${data.rating}★ rating`,
        eventId: data.eventId,
      });
    };

    const onEventApproved = (data: { eventId: string; title: string }) => {
      pushNotification({
        title: 'Event Approved',
        body: data.title,
        eventId: data.eventId,
      });
      triggerDataRefresh();
    };

    const onEventRejected = (data: { eventId: string; title: string }) => {
      pushNotification({
        title: 'Event Rejected',
        body: data.title,
        eventId: data.eventId,
      });
      triggerDataRefresh();
    };

    socket.on('event:status', onEventStatus);
    socket.on('event:created', onEventCreated);
    socket.on('club:created', onClubCreated);
    socket.on('ticket:verified', onTicketVerified);
    socket.on('feedback:submitted', onFeedbackSubmitted);
    socket.on('event:approved', onEventApproved);
    socket.on('event:rejected', onEventRejected);

    return () => {
      socket.off('event:status', onEventStatus);
      socket.off('event:created', onEventCreated);
      socket.off('club:created', onClubCreated);
      socket.off('ticket:verified', onTicketVerified);
      socket.off('feedback:submitted', onFeedbackSubmitted);
      socket.off('event:approved', onEventApproved);
      socket.off('event:rejected', onEventRejected);
    };
  }, [admin, pushNotification, triggerDataRefresh]);

  const handleLogin = (loggedInAdmin: any) => {
    setAdmin(loggedInAdmin);
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
      case 'Dashboard': return <DashboardScreen refreshKey={dataRefreshKey} />;
      case 'Events': return <EventsManagementScreen onDataChange={triggerDataRefresh} notifTrigger={notifTrigger} />;
      case 'Pending': return <PendingEventsScreen onDataChange={triggerDataRefresh} notifTrigger={notifTrigger} />;
      case 'Users': return <UserManagementScreen />;
      case 'Clubs': return <ClubsManagementScreen onDataChange={triggerDataRefresh} />;
      case 'Verify': return <VerifyScreen />;
      case 'Payments': return <PaymentsManagementScreen refreshKey={dataRefreshKey} />;
      case 'Settings': return <SettingsScreen admin={admin} onLogout={handleLogout} />;
      default: return <DashboardScreen refreshKey={dataRefreshKey} />;
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
