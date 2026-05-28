'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import en from './en';
import hi from './hi';
import type { Translations } from './en';

type Lang = 'en' | 'hi';

const DICTS: Record<Lang, Translations> = { en, hi };
const STORAGE_KEY = 'pc-lang';

type I18nCtx = { lang: Lang; t: Translations; setLang: (l: Lang) => void };
const Ctx = createContext<I18nCtx>({ lang: 'en', t: en, setLang: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === 'en' || saved === 'hi') setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
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
