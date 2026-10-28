import firestore from '@react-native-firebase/firestore';

// Firestore's Android disk persistence is ON by default (unlike the web SDK),
// but we set it explicitly so the behaviour is intentional and survives any
// future native-default change: without persistence, offline writes are held in
// memory only and are lost if the app is killed before it reconnects.
//
// `settings()` must run before any other Firestore use, so this module is the
// first import in app/_layout.tsx — importing it has the side effect.
try {
  firestore().settings({ persistence: true });
} catch (err) {
  // Throws if Firestore was already used (e.g. Fast Refresh). Harmless.
  console.warn('[firebase-boot] firestore settings() skipped:', err);
}
