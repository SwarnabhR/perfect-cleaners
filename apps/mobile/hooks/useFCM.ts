import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Registers the device for FCM push notifications and persists the token to
 * the customer's Firestore document. Handles foreground message logging.
 *
 * Must be called from a React component inside the authenticated customer area.
 */
export function useFCM() {
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
            .collection('customers')
            .doc(user.uid)
            .set(
              {
                fcmToken: token,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          console.log('[FCM] Token registered for', user.uid);
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
  }, []);
}
