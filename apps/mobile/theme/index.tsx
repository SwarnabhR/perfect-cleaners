import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, colorsLight } from '@pc/tokens';

export type AppTheme = 'light' | 'dark';
export type ColorPalette = typeof colors | typeof colorsLight;
type ThemeCtx = { theme: AppTheme; toggleTheme: () => void; colors: ColorPalette };

const STORAGE_KEY = '@pc/theme/v3';
// All previous keys — wiped on mount so stale 'dark' values can never resurface.
const LEGACY_KEYS = ['@pc/theme', '@pc/theme/v2'];

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggleTheme: () => {}, colors: colorsLight });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    // Purge every legacy key so stale 'dark' values never come back.
    void AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => {});

    // Then read the current key — null means first run, stay light.
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved === 'dark' || saved === 'light') setTheme(saved);
      })
      .catch(() => {});
  }, []);

  function toggleTheme() {
    const next: AppTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <Ctx.Provider value={{ theme, toggleTheme, colors: theme === 'light' ? colorsLight : colors }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}

/** Convenience alias — returns the active color palette. */
export function useThemeColors() {
  return useContext(Ctx).colors;
}
