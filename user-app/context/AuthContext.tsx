import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../api';

const USER_STORAGE_KEY = 'cuz_events_user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  faculty?: string;
  year?: number;
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; studentId?: string; faculty?: string; year?: number }) => Promise<boolean>;
  googleSignIn: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        setUser(profile);
        userApi.setCurrentUser(profile);
      }
    } catch (e) {
      console.error('Failed to load stored user:', e);
    }
  };

  const storeUser = async (userData: UserProfile | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to store user:', e);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const apiUser = await userApi.login(email, password);
      if (apiUser) {
        const profile: UserProfile = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          studentId: apiUser.studentId,
          faculty: apiUser.faculty,
          year: apiUser.year,
          avatar: apiUser.avatar,
        };
        setUser(profile);
        userApi.setCurrentUser(profile);
        storeUser(profile);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const register = async (data: { name: string; email: string; password: string; studentId?: string; faculty?: string; year?: number }): Promise<boolean> => {
    try {
      const apiUser = await userApi.register(data);
      if (apiUser) {
        const profile: UserProfile = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          studentId: apiUser.studentId,
          faculty: apiUser.faculty,
          year: apiUser.year,
          avatar: apiUser.avatar,
        };
        setUser(profile);
        storeUser(profile);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Register error:', e);
      return false;
    }
  };

  const googleSignIn = async (idToken: string): Promise<boolean> => {
    try {
      console.log('googleSignIn: calling api with idToken');
      const data = await userApi.googleLogin(idToken);
      console.log('googleSignIn: api returned', data);
      if (data && data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          studentId: data.user.studentId,
          faculty: data.user.faculty,
          year: data.user.year,
          avatar: data.user.avatar,
        };
        setUser(profile);
        userApi.setCurrentUser(profile);
        storeUser(profile);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Google sign-in error:', e);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    storeUser(null);
    await userApi.logout();
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user) return false;
      const updatedUser = await userApi.updateProfile(user.id, data);
      const profile: UserProfile = {
        id: updatedUser.id || user.id,
        name: updatedUser.name || data.name || user.name,
        email: updatedUser.email || user.email,
        studentId: updatedUser.studentId || user.studentId,
        faculty: updatedUser.faculty || data.faculty || user.faculty,
        year: updatedUser.year || data.year || user.year,
        avatar: updatedUser.avatar || data.avatar || user.avatar,
      };
      setUser(profile);
      storeUser(profile);
      return true;
    } catch (e) {
      console.error('Update profile error:', e);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user) return false;
      await userApi.changePassword(user.id, currentPassword, newPassword);
      return true;
    } catch (e) {
      console.error('Change password error:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleSignIn, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
