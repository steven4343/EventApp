import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, AppState, Platform } from 'react-native';
import { requestPermissions, getExpoPushToken, getLastCheckTime, setLastCheckTime, notifyNewEvent } from './utils/notifications';
import { addNotification } from './utils/notificationStore';
import { getSocket } from './services/socket';
import { userApi } from './api';

import { AuthProvider, useAuth } from './context/AuthContext';
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
  return (
    <Tab.Navigator
      id="HomeTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="EventsTab"
        children={() => <EventsStack requireAuth={requireAuth} />}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ focused }) => <Text style={styles.tabIcon}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Recommendations"
        children={() => <RecommendationsScreen requireAuth={requireAuth} />}
        options={{
          tabBarLabel: 'Recommended',
          tabBarIcon: ({ focused }) => <Text style={styles.tabIcon}>✨</Text>,
        }}
      />
      <Tab.Screen
        name="ClubsTab"
        children={() => <ClubsStack requireAuth={requireAuth} />}
        options={{
          tabBarLabel: 'Clubs',
          tabBarIcon: ({ focused }) => <Text style={styles.tabIcon}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <Text style={styles.tabIcon}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, googleSignIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEventIds = useRef<Set<string>>(new Set());

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
    if (!ready || !user) return;
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

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
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
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
    paddingBottom: 24,
    height: 80,
  },
  tabIcon: {
    fontSize: 20,
  },

});
