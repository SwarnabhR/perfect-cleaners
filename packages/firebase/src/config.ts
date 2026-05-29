import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore as FirestoreClass, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Next.js exposes NEXT_PUBLIC_*, Expo exposes EXPO_PUBLIC_*
// This lets the shared package work in both without any app-level wiring.
//
// IMPORTANT: Use only direct property access (dot notation) on process.env.
// Next.js statically replaces process.env.NEXT_PUBLIC_* at build time via
// webpack DefinePlugin — but ONLY for statically-analysable property access.
// Computed/bracket notation (process.env[`NEXT_PUBLIC_${key}`]) is NOT
// replaced and will be undefined at runtime in the browser.

function firebaseConfig() {
  return {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  };
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
  return initializeApp(firebaseConfig());
}

// Re-export as getters so existing `import { db, auth } from '@pc/firebase'`
// call sites continue to work without any changes.
export const firebaseApp: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_t, prop)      { return Reflect.get(getFirebaseApp(), prop); },
  set(_t, prop, val) { return Reflect.set(getFirebaseApp(), prop, val); },
});

let _db:   Firestore | undefined;
let _auth: Auth     | undefined;

export function getDb():   Firestore { return (_db   ??= getFirestore(getFirebaseApp())); }
export function getAuthInstance(): Auth { return (_auth ??= getAuth(getFirebaseApp())); }

// Helper to create a Proxy that lazily initializes Firebase but still
// behaves like a real SDK instance (passes `instanceof` and `in` checks).
// The `set` trap is critical — Firestore's `ensureFirestoreConfigured` writes
// `e._firestoreClient` onto the instance and must persist it for subsequent reads.
function lazyProxy<T extends object>(init: () => T, proto: object): T {
  return new Proxy({} as T, {
    get(_t, prop)           { return Reflect.get(init(), prop); },
    set(_t, prop, val)      { return Reflect.set(init(), prop, val); },
    has(_t, prop)           { return Reflect.has(init(), prop); },
    getPrototypeOf()        { return proto; },
    ownKeys()               { return Reflect.ownKeys(init()); },
    getOwnPropertyDescriptor(_t, prop) {
      return Reflect.getOwnPropertyDescriptor(init(), prop);
    },
  });
}

// Backwards-compatible named exports — these are Proxy objects whose
// properties are resolved lazily on first property access, not at import time.
export const db: Firestore = lazyProxy(getDb, FirestoreClass.prototype);

export const auth: Auth = new Proxy({} as Auth, {
  get(_t, prop)      { return Reflect.get(getAuthInstance(), prop); },
  set(_t, prop, val) { return Reflect.set(getAuthInstance(), prop, val); },
  has(_t, prop)      { return Reflect.has(getAuthInstance(), prop); },
  getPrototypeOf()   { return Object.getPrototypeOf(getAuthInstance()); },
});
