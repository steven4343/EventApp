import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = 'cuz_events_dark_mode';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  border: string;
  inputBg: string;
  headerBg: string;
  headerText: string;
  danger: string;
  success: string;
  warning: string;
}

const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#fff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  border: '#e2e8f0',
  inputBg: '#f8fafc',
  headerBg: '#2563eb',
  headerText: '#fff',
  danger: '#ef4444',
  success: '#16a34a',
  warning: '#f59e0b',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  card: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#60a5fa',
  primaryLight: '#1e3a5f',
  border: '#334155',
  inputBg: '#1e293b',
  headerBg: '#1e293b',
  headerText: '#f1f5f9',
  danger: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
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
