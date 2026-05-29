import React, { createContext, useContext, type ReactNode } from 'react';
import { colorsLight } from '@pc/tokens';

// Dark mode is intentionally removed for mobile users.
// The app is light-only. userInterfaceStyle in app.json is also set to "light".
export type AppTheme = 'light';
export type ColorPalette = typeof colorsLight;
type ThemeCtx = { theme: AppTheme; colors: ColorPalette };

const Ctx = createContext<ThemeCtx>({ theme: 'light', colors: colorsLight });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Ctx.Provider value={{ theme: 'light', colors: colorsLight }}>
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
