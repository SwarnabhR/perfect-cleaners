'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
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

  // Live-sync worker doc by phone number — works regardless of document ID.
  // Workers created via the API use Firebase Auth UID as doc ID, but manually
  // created docs may use a different ID. Phone is the canonical identity.
  useEffect(() => {
    if (!user?.phoneNumber) { setWorker(null); setLoading(false); return; }
    const q = query(
      collection(db, 'workers'),
      where('phone', '==', user.phoneNumber),
      limit(1),
    );
    const unsub = onSnapshot(
      q,
      snap => {
        if (!snap.empty) {
          const d = snap.docs[0];
          setWorker({ ...(d.data() as Worker), id: d.id });
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
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/worker/login') {
      router.replace(`/worker/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user && worker && pathname === '/worker/login') {
      const from = searchParams.get('from');
      // Redirect to intended page if coming via auth-guard, otherwise dashboard.
      router.replace(from ?? '/worker/dashboard');
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
