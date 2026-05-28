import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import hi from './hi';
import type { MobileTranslations } from './en';

type Lang = 'en' | 'hi';

const DICTS: Record<Lang, MobileTranslations> = { en, hi };
const STORAGE_KEY = '@pc/lang';

type I18nCtx = { lang: Lang; t: MobileTranslations; setLang: (l: Lang) => void };
const Ctx = createContext<I18nCtx>({ lang: 'en', t: en, setLang: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'en' || saved === 'hi') setLangState(saved as Lang);
    });
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    void AsyncStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <Ctx.Provider value={{ lang, t: DICTS[lang], setLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  return useContext(Ctx);
}
