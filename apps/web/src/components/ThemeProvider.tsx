'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('pc-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') apply(saved);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('pc-theme', t);
  }

  return (
    <Ctx.Provider value={{ theme, toggle: () => apply(theme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
