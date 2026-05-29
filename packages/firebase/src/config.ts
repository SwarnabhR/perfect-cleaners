import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Next.js exposes NEXT_PUBLIC_*, Expo exposes EXPO_PUBLIC_*
// This lets the shared package work in both without any app-level wiring.
function env(key: string): string {
  return (
    process.env[`NEXT_PUBLIC_${key}`] ??
    process.env[`EXPO_PUBLIC_${key}`] ??
    ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lazy initialisation
// ─────────────────────────────────────────────────────────────────────────────
// Firebase MUST NOT be initialised at module-evaluation time.
// During Next.js static generation (prerender), env vars are absent and
// initializeApp throws auth/invalid-api-key before any component mounts.
// Wrapping everything in a getter means Firebase is only touched when a
// component actually calls db / auth — which never happens during prerender
// for 'use client' pages that are force-dynamic.

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey:            env('FIREBASE_API_KEY'),
    authDomain:        env('FIREBASE_AUTH_DOMAIN'),
    projectId:         env('FIREBASE_PROJECT_ID'),
    storageBucket:     env('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID'),
    appId:             env('FIREBASE_APP_ID'),
    measurementId:     env('FIREBASE_MEASUREMENT_ID') || undefined,
  });
}

// Re-export as getters so existing `import { db, auth } from '@pc/firebase'`
// call sites continue to work without any changes.
export const firebaseApp: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_t, prop) { return Reflect.get(getFirebaseApp(), prop); },
});

let _db:   Firestore | undefined;
let _auth: Auth     | undefined;

export function getDb():   Firestore { return (_db   ??= getFirestore(getFirebaseApp())); }
export function getAuthInstance(): Auth { return (_auth ??= getAuth(getFirebaseApp())); }

// Backwards-compatible named exports — these are Proxy objects whose
// properties are resolved lazily on first property access, not at import time.
export const db: Firestore = new Proxy({} as Firestore, {
  get(_t, prop) { return Reflect.get(getDb(), prop); },
});

export const auth: Auth = new Proxy({} as Auth, {
  get(_t, prop) { return Reflect.get(getAuthInstance(), prop); },
});
