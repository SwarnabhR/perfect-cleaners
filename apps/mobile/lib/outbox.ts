import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminPost, NetworkError, ApiError } from './webApi';

// AsyncStorage-backed outbox for the admin actions that go over HTTP (approve
// signup, mark paid, edit a society record). Firestore-direct writes are already
// queued by the SDK's own offline engine — this covers only the fetch calls,
// which have no such queue. Replayed on reconnect by ConnectivityProvider.

const KEY = '@pc/outbox';

export interface OutboxItem {
  id: string;
  path: string;
  body: unknown;
  opId: string;
  createdAt: number;
  attempts: number;
}

export interface FlushResult {
  sent: number;
  failed: number;
  remaining: number;
}

// Serialise all mutations so two quick actions can't clobber the stored list.
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getPending(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

async function write(items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueue(path: string, body: unknown): Promise<OutboxItem> {
  return serialize(async () => {
    const items = await getPending();
    const item: OutboxItem = { id: newId(), path, body, opId: newId(), createdAt: Date.now(), attempts: 0 };
    items.push(item);
    await write(items);
    return item;
  });
}

/**
 * Replay every queued request in order. Stops at the first network failure
 * (keeping that item and everything after it for the next attempt); a permanent
 * API error (4xx/5xx other than an already-applied 409) is dropped rather than
 * retried forever.
 */
export async function flush(): Promise<FlushResult> {
  return serialize(async () => {
    const items = await getPending();
    if (items.length === 0) return { sent: 0, failed: 0, remaining: 0 };

    let sent = 0;
    let failed = 0;
    let i = 0;
    for (; i < items.length; i++) {
      const item = items[i];
      try {
        await adminPost(item.path, item.body, item.opId);
        sent++;
      } catch (err) {
        if (err instanceof NetworkError) break; // network gone again — keep from here on
        // No usable session yet (flushing on launch before sign-in) — keep and retry.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) break;
        failed++; // permanent server error — drop it
      }
    }

    const remaining = items.slice(i);
    await write(remaining);
    return { sent, failed, remaining: remaining.length };
  });
}

/**
 * Send now, or queue when offline. `queued: true` means the action is saved
 * locally and will be replayed on reconnect; the caller should reflect the
 * change optimistically.
 */
export async function postOrQueue<T = Record<string, unknown>>(
  path: string,
  body: unknown,
): Promise<{ queued: boolean; data?: T }> {
  try {
    const data = await adminPost<T>(path, body);
    return { queued: false, data };
  } catch (err) {
    if (err instanceof NetworkError) {
      await enqueue(path, body);
      return { queued: true };
    }
    throw err;
  }
}
