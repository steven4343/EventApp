import { en } from './en';
import { fr } from './fr';
import { pt } from './pt';
import { sw } from './sw';

const translations: Record<string, typeof en> = { en, fr, pt, sw };

export type TranslationKey = string;

export function t(language: string, key: string): string {
  const keys = key.split('.');
  let value: any = translations[language] || translations['en'];
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      value = translations['en'];
      for (const ek of keys) {
        if (value && typeof value === 'object' && ek in value) {
          value = value[ek];
        } else {
          return key;
        }
      }
      return value as string;
    }
  }
  return typeof value === 'string' ? value : key;
}

export const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
];

export { translations };
