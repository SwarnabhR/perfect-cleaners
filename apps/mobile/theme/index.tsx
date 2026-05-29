import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, colorsLight } from '@pc/tokens';

export type AppTheme = 'light' | 'dark';
export type ColorPalette = typeof colors | typeof colorsLight;
type ThemeCtx = { theme: AppTheme; toggleTheme: () => void; colors: ColorPalette };

// v2: busts any stale 'dark' value written when userInterfaceStyle was locked to dark.
const STORAGE_KEY = '@pc/theme/v2';
const Ctx = createContext<ThemeCtx>({ theme: 'light', toggleTheme: () => {}, colors: colorsLight });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always starts light. AsyncStorage only overrides if the user has
  // explicitly toggled after this version was deployed.
  const [theme, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved === 'dark' || saved === 'light') setTheme(saved);
        // null / missing → stay on 'light' default
      })
      .catch(() => {
        // Storage unavailable → stay on 'light'
      });
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
