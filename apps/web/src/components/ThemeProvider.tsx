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
    const html = document.documentElement;
    html.classList.add('pc-theme-transitioning');
    setTheme(t);
    html.setAttribute('data-theme', t);
    localStorage.setItem('pc-theme', t);
    const tid = window.setTimeout(() => html.classList.remove('pc-theme-transitioning'), 260);
    return () => window.clearTimeout(tid);
  }

  return (
    <Ctx.Provider value={{ theme, toggle: () => apply(theme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
