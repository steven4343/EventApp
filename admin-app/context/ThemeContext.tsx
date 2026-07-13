import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = 'cuz_events_admin_dark_mode';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  border: string;
  inputBg: string;
  headerBg: string;
  headerText: string;
  danger: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  accent: string;
  accentLight: string;
  surface: string;
  surfaceElevated: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
}

const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  surface: '#f1f5f9',
  surfaceElevated: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  primaryDark: '#4f46e5',
  border: '#e2e8f0',
  inputBg: '#f8fafc',
  headerBg: '#6366f1',
  headerText: '#ffffff',
  danger: '#ef4444',
  success: '#22c55e',
  successLight: '#f0fdf4',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  accent: '#8b5cf6',
  accentLight: '#f5f3ff',
  overlay: 'rgba(0,0,0,0.5)',
  skeleton: '#e2e8f0',
  skeletonHighlight: '#f1f5f9',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  card: '#1e293b',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#818cf8',
  primaryLight: '#1e1b4b',
  primaryDark: '#6366f1',
  border: '#334155',
  inputBg: '#1e293b',
  headerBg: '#1e293b',
  headerText: '#f1f5f9',
  danger: '#f87171',
  success: '#4ade80',
  successLight: '#052e16',
  warning: '#fbbf24',
  warningLight: '#451a03',
  accent: '#a78bfa',
  accentLight: '#2e1065',
  overlay: 'rgba(0,0,0,0.7)',
  skeleton: '#334155',
  skeletonHighlight: '#475569',
};

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleDark: (val: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  toggleDark: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then(v => {
      if (v) setIsDark(v === 'true');
    });
  }, []);

  const toggleDark = async (val: boolean) => {
    setIsDark(val);
    await AsyncStorage.setItem(DARK_MODE_KEY, val.toString());
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
