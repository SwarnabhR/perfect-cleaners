'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
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
  const router   = useRouter();
  const pathname = usePathname();

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

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/worker/login') {
      router.replace('/worker/login');
    }
  }, [user, loading, pathname]);

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
