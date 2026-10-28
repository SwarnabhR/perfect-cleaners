import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { flush, getPending } from './outbox';

interface ConnectivityValue {
  /** Device has a usable internet connection. */
  isOnline: boolean;
  /** Number of admin actions waiting in the outbox. */
  pending: number;
  /** A replay is in progress. */
  syncing: boolean;
  /** Re-read the queued count (call right after enqueueing an action). */
  refreshPending: () => void;
  /** Replay the outbox now. */
  sync: () => Promise<void>;
}

const Ctx = createContext<ConnectivityValue>({
  isOnline: true,
  pending: 0,
  syncing: false,
  refreshPending: () => {},
  sync: async () => {},
});

/**
 * Watches connectivity and drives the outbox: flushes on mount, whenever the
 * device comes back online, and when the app returns to the foreground. Exposes
 * the state the offline/sync status strip renders.
 */
export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending]   = useState(0);
  const [syncing, setSyncing]   = useState(false);
  const onlineRef = useRef(true);

  const refreshPending = useCallback(() => {
    getPending().then(items => setPending(items.length)).catch(() => {});
  }, []);

  const sync = useCallback(async () => {
    if (!onlineRef.current) return;
    setSyncing(true);
    try {
      await flush();
    } finally {
      setSyncing(false);
      refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();

    const unsubscribe = NetInfo.addEventListener(state => {
      const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
      const cameOnline = online && !onlineRef.current;
      onlineRef.current = online;
      setIsOnline(online);
      if (cameOnline) void sync();
    });

    const appSub = AppState.addEventListener('change', next => {
      if (next === 'active') void sync();
    });

    // Best-effort flush on first mount (may be a no-op when already empty).
    void sync();

    return () => {
      unsubscribe();
      appSub.remove();
    };
  }, [sync, refreshPending]);

  return (
    <Ctx.Provider value={{ isOnline, pending, syncing, refreshPending, sync }}>
      {children}
    </Ctx.Provider>
  );
}

export function useConnectivity(): ConnectivityValue {
  return useContext(Ctx);
}
