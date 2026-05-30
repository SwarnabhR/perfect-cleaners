import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Registers the device for FCM push notifications and persists the token to
 * the user's Firestore document. Calls `onForegroundMessage` when a push
 * arrives while the app is in the foreground.
 *
 * @param targetCollection  'customers' (default) or 'workers'
 * @param onForegroundMessage  Optional callback — receives title + body of the
 *   incoming message. Use a ref-stable function or rely on the internal
 *   useRef forwarding to avoid stale closures.
 */
export function useFCM(
  targetCollection: 'customers' | 'workers' = 'customers',
  onForegroundMessage?: (title: string, body: string) => void,
) {
  // Keep the latest callback in a ref so the onMessage handler (registered
  // once in the empty-dep effect) always calls the current version.
  const cbRef = useRef(onForegroundMessage);
  useEffect(() => { cbRef.current = onForegroundMessage; });

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let unsubForeground: (() => void) | undefined;

    async function register() {
      try {
        const permission = await messaging().requestPermission();
        const authorized =
          permission === messaging.AuthorizationStatus.AUTHORIZED ||
          permission === messaging.AuthorizationStatus.PROVISIONAL;

        if (!authorized) {
          console.log('[FCM] Notification permission denied');
          return;
        }

        const token = await messaging().getToken();
        const user  = auth().currentUser;

        if (user && token) {
          await firestore()
            .collection(targetCollection)
            .doc(user.uid)
            .set(
              { fcmToken: token, updatedAt: firestore.FieldValue.serverTimestamp() },
              { merge: true },
            );
          console.log(`[FCM] Token registered for ${user.uid} in ${targetCollection}`);
        }
      } catch (err: any) {
        console.warn('[FCM] Registration failed:', err?.message);
      }
    }

    register();

    unsubForeground = messaging().onMessage(async msg => {
      const title = msg.notification?.title ?? '';
      const body  = msg.notification?.body  ?? '';
      console.log('[FCM] Foreground message:', title, body);
      if (title) cbRef.current?.(title, body);
    });

    return () => { unsubForeground?.(); };
  // targetCollection is a stable string literal at each call site.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
