import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Registers the device for FCM push notifications and persists the token to
 * the user's Firestore document. Handles foreground message logging.
 *
 * @param targetCollection - Firestore collection to write the token to.
 *   Pass `'customers'` (default) for the customer app, `'workers'` for the
 *   worker app.
 *
 * Must be called from a React component inside the authenticated area.
 */
export function useFCM(targetCollection: 'customers' | 'workers' = 'customers') {
  useEffect(() => {
    // FCM requires native modules — skip on web
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
        const user = auth().currentUser;

        if (user && token) {
          await firestore()
            .collection(targetCollection)
            .doc(user.uid)
            .set(
              {
                fcmToken: token,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          console.log(`[FCM] Token registered for ${user.uid} in ${targetCollection}`);
        }
      } catch (err: any) {
        console.warn('[FCM] Registration failed:', err?.message);
      }
    }

    register();

    // Foreground message handler — show in-app alert or notification banner here
    unsubForeground = messaging().onMessage(async msg => {
      console.log('[FCM] Foreground message:', msg.notification?.title, msg.notification?.body);
      // TODO: show in-app toast/snackbar when notification UI is added
    });

    return () => {
      unsubForeground?.();
    };
  // targetCollection is stable (a string literal at each call site) so the
  // dependency array is intentionally kept empty to mirror the previous
  // behaviour of registering once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
