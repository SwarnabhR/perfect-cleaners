import auth from '@react-native-firebase/auth';

export const WEB_API_URL = process.env.EXPO_PUBLIC_WEB_API_URL ?? 'https://perfectcleaners.co.in';

/** The request never reached the server (offline / DNS / timeout). Safe to queue and replay later. */
export class NetworkError extends Error {
  constructor(message = 'You appear to be offline.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** The server answered with a non-2xx status. Replaying will not help. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * POSTs JSON to an authenticated web admin endpoint.
 *
 * `opId` is a client-generated idempotency key (sent as `X-Op-Id`) so a queued
 * action that is replayed after reconnect can be de-duplicated server-side.
 *
 * Throws `NetworkError` when the fetch never completed (offline) and `ApiError`
 * for a non-2xx response, so callers — and the outbox — can tell the two apart.
 */
export async function adminPost<T = Record<string, unknown>>(
  path: string,
  body: unknown,
  opId?: string,
): Promise<T> {
  const token = await auth().currentUser?.getIdToken();
  if (!token) throw new ApiError('You are signed out. Please sign in again.', 401);

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(`${WEB_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opId ? { 'X-Op-Id': opId } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    // A replay that hits an already-applied guard is a success, not a failure:
    // record-payment returns 409 ALREADY_SETTLED when the due is already paid.
    // Treat exactly that as applied so the outbox drops it instead of retrying.
    if (res.status === 409 && data.error === 'ALREADY_SETTLED') return data as T;
    throw new ApiError(data.error ?? 'Request failed.', res.status);
  }
  return data as T;
}
