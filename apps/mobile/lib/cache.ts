import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type Query = FirebaseFirestoreTypes.Query;
type QueryDocumentSnapshot = FirebaseFirestoreTypes.QueryDocumentSnapshot;
type DocumentReference = FirebaseFirestoreTypes.DocumentReference;
type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;

/**
 * Reads a query with a cache fallback. Firestore's default source already falls
 * back to cache when the server is unreachable, but a query that has never been
 * synced rejects outright — retrying against the local cache lets a screen show
 * the last-known data (or nothing) instead of an error when offline.
 */
export async function getCachedDocs(query: Query): Promise<QueryDocumentSnapshot[]> {
  try {
    return (await query.get()).docs;
  } catch {
    try {
      return (await query.get({ source: 'cache' })).docs;
    } catch {
      return [];
    }
  }
}

export async function getCachedDoc(ref: DocumentReference): Promise<DocumentSnapshot | null> {
  try {
    return await ref.get();
  } catch {
    try {
      return await ref.get({ source: 'cache' });
    } catch {
      return null;
    }
  }
}
