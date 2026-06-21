import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as translate } from '../i18n';

const LANGUAGE_KEY = 'cuz_events_language';

interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then(v => {
      if (v) setLang(v);
    });
  }, []);

  const setLanguage = async (lang: string) => {
    setLang(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  const t = (key: string) => translate(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
