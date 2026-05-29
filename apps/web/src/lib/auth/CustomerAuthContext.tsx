'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { auth } from '@pc/firebase';

interface AuthCtx {
  user:    User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Context = createContext<AuthCtx>({
  user:    null,
  loading: true,
  signOut: async () => {},
});

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <Context.Provider value={{ user, loading, signOut: () => fbSignOut(auth) }}>
      {children}
    </Context.Provider>
  );
}

export const useCustomerAuth = () => useContext(Context);
