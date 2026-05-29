'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { auth } from '@pc/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AdminAuthCtx {
  user:    User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx>({
  user: null, loading: true, signOut: async () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
      if (!u && pathname !== '/login') router.replace('/login');
    });
  }, [pathname]);

  async function signOut() {
    await fbSignOut(auth);
    router.replace('/login');
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--pc-ink)',
      }}>
        <span style={{ fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg-3)', fontSize: 13 }}>
          Loading…
        </span>
      </div>
    );
  }

  return <Ctx.Provider value={{ user, loading, signOut }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() { return useContext(Ctx); }
