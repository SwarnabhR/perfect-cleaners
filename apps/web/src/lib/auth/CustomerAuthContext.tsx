'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@pc/firebase';

interface AuthCtx {
  user:        User | null;
  loading:     boolean;
  profileName: string;
  signOut:     () => Promise<void>;
}

const Context = createContext<AuthCtx>({
  user:        null,
  loading:     true,
  profileName: '',
  signOut:     async () => {},
});

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
      if (!u) setProfileName('');
    });
  }, []);

  // Live-sync the customer's display name from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'customers', user.uid), snap => {
      setProfileName(snap.exists() ? (snap.data().name ?? '') : '');
    });
    return unsub;
  }, [user?.uid]);

  return (
    <Context.Provider value={{ user, loading, profileName, signOut: () => fbSignOut(auth) }}>
      {children}
    </Context.Provider>
  );
}

export const useCustomerAuth = () => useContext(Context);
