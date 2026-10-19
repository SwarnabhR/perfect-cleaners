import auth from '@react-native-firebase/auth';

export const WEB_API_URL = process.env.EXPO_PUBLIC_WEB_API_URL ?? 'https://perfectcleaners.co.in';

/** POSTs JSON to an authenticated web admin endpoint; throws with the server's error message. */
export async function adminPost<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const token = await auth().currentUser?.getIdToken();
  if (!token) throw new Error('You are signed out. Please sign in again.');
  const res = await fetch(`${WEB_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed.');
  return data as T;
}
