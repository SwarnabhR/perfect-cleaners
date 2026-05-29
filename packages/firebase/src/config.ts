import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Next.js exposes NEXT_PUBLIC_*, Expo exposes EXPO_PUBLIC_*
// This lets the shared package work in both without any app-level wiring.
function env(key: string): string {
  return (
    process.env[`NEXT_PUBLIC_${key}`] ??
    process.env[`EXPO_PUBLIC_${key}`] ??
    ''
  );
}

const firebaseConfig = {
  apiKey:            env('FIREBASE_API_KEY'),
  authDomain:        env('FIREBASE_AUTH_DOMAIN'),
  projectId:         env('FIREBASE_PROJECT_ID'),
  storageBucket:     env('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID'),
  appId:             env('FIREBASE_APP_ID'),
  measurementId:     env('FIREBASE_MEASUREMENT_ID') || undefined,
};

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db   = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
