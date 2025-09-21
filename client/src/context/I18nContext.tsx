import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type LangCode = 'en' | 'hi' | 'es' | 'fr' | 'de';

// Minimal translation dictionaries. Expand as needed.
const dictionaries: Record<LangCode, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.problems': 'Problems',
    'nav.contests': 'Contests',
    'nav.discuss': 'Discuss',
    'nav.leaderboard': 'Leaderboard',
    'nav.company': 'Company',
    'nav.contact': 'Contact',
    'nav.wallet': 'Wallet',
    'settings.title': 'Settings',
    'settings.preferences.language': 'Language',
  },
  hi: {
    'nav.home': 'मुखपृष्ठ',
    'nav.problems': 'समस्याएँ',
    'nav.contests': 'प्रतियोगिताएँ',
    'nav.discuss': 'चर्चा',
    'nav.leaderboard': 'लीडरबोर्ड',
    'nav.company': 'कंपनी',
    'nav.contact': 'संपर्क',
    'nav.wallet': 'वॉलेट',
    'settings.title': 'सेटिंग्स',
    'settings.preferences.language': 'भाषा',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.problems': 'Problemas',
    'nav.contests': 'Concursos',
    'nav.discuss': 'Debate',
    'nav.leaderboard': 'Clasificación',
    'nav.company': 'Compañía',
    'nav.contact': 'Contacto',
    'nav.wallet': 'Billetera',
    'settings.title': 'Configuración',
    'settings.preferences.language': 'Idioma',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.problems': 'Problèmes',
    'nav.contests': 'Concours',
    'nav.discuss': 'Discussion',
    'nav.leaderboard': 'Classement',
    'nav.company': 'Entreprise',
    'nav.contact': 'Contact',
    'nav.wallet': 'Portefeuille',
    'settings.title': 'Paramètres',
    'settings.preferences.language': 'Langue',
  },
  de: {
    'nav.home': 'Startseite',
    'nav.problems': 'Aufgaben',
    'nav.contests': 'Wettbewerbe',
    'nav.discuss': 'Diskutieren',
    'nav.leaderboard': 'Bestenliste',
    'nav.company': 'Unternehmen',
    'nav.contact': 'Kontakt',
    'nav.wallet': 'Wallet',
    'settings.title': 'Einstellungen',
    'settings.preferences.language': 'Sprache',
  },
};

interface I18nContextValue {
  lang: LangCode;
  setLanguage: (lang: LangCode) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ initialLang?: LangCode; children: React.ReactNode }> = ({ initialLang, children }) => {
  const [lang, setLang] = useState<LangCode>(() => {
    const saved = (localStorage.getItem('lang') as LangCode | null) || undefined;
    return initialLang || saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const t = useMemo(() => {
    const dict = dictionaries[lang] || dictionaries.en;
    return (key: string) => dict[key] ?? key;
  }, [lang]);

  const setLanguage = (next: LangCode) => setLang(next);

  const value: I18nContextValue = { lang, setLanguage, t };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
