'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@pc/firebase';
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
    return onAuthStateChanged(auth, async u => {
      if (!u) {
        setUser(null);
        setLoading(false);
        if (pathname !== '/login') router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        return;
      }

      // Verify the signed-in user exists in the admins collection
      const adminSnap = await getDoc(doc(db, 'admins', u.uid));
      if (!adminSnap.exists()) {
        await fbSignOut(auth);
        setUser(null);
        setLoading(false);
        router.replace('/login?error=unauthorized');
        return;
      }

      setUser(u);
      setLoading(false);
      if (pathname === '/login') router.replace('/dashboard');
    });
  }, [pathname]);

  async function signOut() {
    try {
      // Get current token and revoke it server-side
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }).catch(err => console.error('[logout] API call failed:', err));
      }
    } catch (err) {
      console.error('[signOut] error during logout:', err);
    } finally {
      // Clear client-side auth state
      await fbSignOut(auth);
      router.replace('/login');
    }
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
