'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['es']) => string;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    // Load language from localStorage safely on client mount
    try {
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang === 'es' || savedLang === 'en') {
        setLanguageState(savedLang);
      } else {
        const browserLang = navigator.language.slice(0, 2);
        if (browserLang === 'en') {
          setLanguageState('en');
        }
      }
    } catch (e) {
      console.warn('Storage or navigation not available during SSR:', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      console.error('Failed to save language choice:', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
  };

  const t = (key: keyof typeof translations['es']): string => {
    const langDict = translations[language] || translations['es'];
    return langDict[key] || translations['es'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
