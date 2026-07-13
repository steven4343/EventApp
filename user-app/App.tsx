import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermissions, getExpoPushToken, getLastCheckTime, setLastCheckTime, notifyNewEvent } from './utils/notifications';
import { addNotification } from './utils/notificationStore';
import { getSocket } from './services/socket';
import { userApi } from './api';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { LoginScreen } from './components/screens/LoginScreen';
import { onRedirectToken, checkRedirectResult } from './services/googleAuth';
import { EventListScreen } from './components/screens/EventListScreen';
import { EventDetailsScreen } from './components/screens/EventDetailsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ClubsScreen } from './components/screens/ClubsScreen';
import { ClubDetailsScreen } from './components/screens/ClubDetailsScreen';
import { ClubAdminScreen } from './components/screens/ClubAdminScreen';
import { RecommendationsScreen } from './components/screens/RecommendationsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { EditProfileScreen } from './components/screens/EditProfileScreen';
import { ChangePasswordScreen } from './components/screens/ChangePasswordScreen';
import { HelpSupportScreen } from './components/screens/HelpSupportScreen';
import { MyTicketsScreen } from './components/screens/MyTicketsScreen';
import { SavedEventsScreen } from './components/screens/SavedEventsScreen';
import { MyClubsScreen } from './components/screens/MyClubsScreen';
import { MyReviewsScreen } from './components/screens/MyReviewsScreen';
import { ResponsiveTabBar } from './components/navigation/ResponsiveTabBar';
import { DesktopNav } from './components/navigation/DesktopNav';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator id="ProfileStack">
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SavedEvents" component={SavedEventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyClubs" component={MyClubsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function EventsStack({ requireAuth }: { requireAuth: () => void }) {
  return (
    <Stack.Navigator
      id="EventsStack"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="EventList" component={EventListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}

function ClubsStack({ requireAuth }: { requireAuth: () => void }) {
  return (
    <Stack.Navigator
      id="ClubsStack"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="ClubsList" component={ClubsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClubDetails" component={ClubDetailsScreen} />
      <Stack.Screen name="ClubAdmin" component={ClubAdminScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function HomeTabs({ requireAuth }: { requireAuth: () => void }) {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        id="HomeTabs"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <ResponsiveTabBar {...props} />}
      >
        <Tab.Screen
          name="EventsTab"
          children={() => <EventsStack requireAuth={requireAuth} />}
          options={{ tabBarLabel: 'Events', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="Recommendations"
          children={() => <RecommendationsScreen requireAuth={requireAuth} />}
          options={{ tabBarLabel: 'Recommended', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="ClubsTab"
          children={() => <ClubsStack requireAuth={requireAuth} />}
          options={{ tabBarLabel: 'Clubs', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{ tabBarLabel: 'Profile', tabBarIcon: () => null }}
        />
      </Tab.Navigator>
    </View>
  );
}

function AppContent() {
  const { user, googleSignIn } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEventIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem('cuz_events_notifications').then(v => {
      if (v) setNotifsEnabled(v === 'true');
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, ready]);

  useEffect(() => {
    onRedirectToken(async (idToken) => {
      const success = await googleSignIn(idToken);
      if (success) {
        setShowLogin(false);
      }
    });
    if (Platform.OS === 'web') {
      checkRedirectResult();
    }
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !user || !notifsEnabled) return;
    requestPermissions().then(async () => {
      const token = await getExpoPushToken();
      if (token) await userApi.registerPushToken(token);
    });
    const checkNewEvents = async () => {
      try {
        const lastCheck = await getLastCheckTime();
        const now = new Date().toISOString();
        const events = await userApi.getRecentEvents(lastCheck);
        for (const event of events) {
          await notifyNewEvent('New Event Posted', event.title);
          await addNotification({
            id: `notif_${event.id}_${Date.now()}`,
            title: 'New Event Posted',
            body: event.title,
            timestamp: new Date().toISOString(),
            read: false,
            eventId: event.id,
          });
          lastEventIds.current.add(event.id);
        }
        await setLastCheckTime(now);
      } catch {
        // silent
      }
    };
    const checkEventStatus = async () => {
      try {
        const all = await userApi.getEvents();
        const currentIds = new Set(all.map(e => e.id));
        for (const prevId of lastEventIds.current) {
          if (!currentIds.has(prevId)) {
            for (const e of all) {
              if (e.id === prevId) continue;
            }
            await addNotification({
              id: `notif_${prevId}_${Date.now()}`,
              title: 'Event Unpublished',
              body: 'An event was unpublished',
              timestamp: new Date().toISOString(),
              read: false,
              eventId: prevId,
            });
          }
        }
        lastEventIds.current = currentIds;
      } catch { /* silent */ }
    };
    checkNewEvents();
    pollingRef.current = setInterval(() => { checkNewEvents(); checkEventStatus(); }, 60000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ready, user]);

  useEffect(() => {
    if (!ready || !user) return;
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { eventId: string; title: string; status: string; timestamp: string }) => {
      const message = data.status === 'Published' ? 'New event published' : `Event ${data.status.toLowerCase()}`;
      addNotification({
        id: `notif_${data.eventId}_${Date.now()}`,
        title: 'Event Update',
        body: `${data.title} — ${message}`,
        timestamp: new Date().toISOString(),
        read: false,
        eventId: data.eventId,
      });
    };
    socket.on('event:status', handler);
    return () => { socket.off('event:status', handler); };
  }, [ready, user]);

  const requireAuth = () => {
    if (!user) {
      setShowLogin(true);
      return false;
    }
    return true;
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <StatusBar style="auto" />
      </View>
    );
  }

  const navTheme = isDark ? {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: '#0f172a', card: '#1e293b', text: '#f1f5f9', border: '#334155', primary: '#6366f1' },
  } : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: '#f5f5f7', card: '#ffffff', text: '#1e293b', border: '#e5e5ea', primary: '#6366f1' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'auto'} />
        {showLogin ? (
          <LoginScreen onCancel={() => setShowLogin(false)} />
        ) : (
          <HomeTabs requireAuth={requireAuth} />
        )}
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({});
