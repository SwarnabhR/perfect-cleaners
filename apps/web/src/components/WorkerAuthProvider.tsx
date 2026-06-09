'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { auth, db } from '@pc/firebase';
import type { Worker } from '@pc/firebase';

interface WorkerAuthCtx {
  user:    User | null;
  worker:  (Worker & { id: string }) | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<WorkerAuthCtx>({
  user: null, worker: null, loading: true, signOut: async () => {},
});

export function WorkerAuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [worker,  setWorker]  = useState<(Worker & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Firebase Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) { setWorker(null); setLoading(false); }
    });
  }, []);

  // Live-sync workers/{uid} — determines if this user is a worker
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'workers', user.uid),
      snap => {
        if (snap.exists()) {
          setWorker({ ...(snap.data() as Worker), id: snap.id });
        } else {
          setWorker(null);
        }
        setLoading(false);
      },
      () => { setWorker(null); setLoading(false); },
    );
    return unsub;
  }, [user?.uid]);

  // Redirect unauthenticated users to login; redirect authenticated workers away from login.
  // If an authenticated user manually navigates to /worker/login (e.g. to switch account),
  // sign them out first so the login form is always reachable.
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/worker/login') {
      router.replace(`/worker/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user && pathname === '/worker/login') {
      const from = searchParams.get('from');
      if (worker && from) {
        // Came here via an auth-guard redirect — bounce back to the intended page.
        router.replace(from);
      } else if (worker && !from) {
        // Already authenticated worker navigated here directly — sign out so the
        // login form is usable (allows switching accounts).
        fbSignOut(auth);
      }
    }
  }, [user, worker, loading, pathname]);

  async function signOut() {
    await fbSignOut(auth);
    router.replace('/worker/login');
  }

  return (
    <Ctx.Provider value={{ user, worker, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWorkerAuth = () => useContext(Ctx);
