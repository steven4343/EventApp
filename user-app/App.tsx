import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/screens/LoginScreen';
import { EventListScreen } from './components/screens/EventListScreen';
import { EventDetailsScreen } from './components/screens/EventDetailsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ClubsScreen } from './components/screens/ClubsScreen';
import { ClubDetailsScreen } from './components/screens/ClubDetailsScreen';
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
          tabBarIcon: ({ focused }) => <Text style={styles.tabIcon}>🏠</Text>,
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
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const prevUserRef = useRef(user);

  useEffect(() => {
    if (!user && !showLogin) {
      setShowLogin(true);
    }
    if (prevUserRef.current && !user) {
      setShowLogin(true);
    }
    prevUserRef.current = user;
  }, [user]);

  const requireAuth = () => {
    if (!user) {
      setShowLogin(true);
      return false;
    }
    return true;
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {showLogin ? (
        <LoginScreen onCancel={() => setShowLogin(false)} />
      ) : (
        <HomeTabs requireAuth={requireAuth} />
      )}
    </NavigationContainer>
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
