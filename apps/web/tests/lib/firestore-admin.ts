/**
 * Firestore Admin SDK access for tests that need to seed state the UI alone
 * can't reach (e.g. a customerSocietyRecords doc in 'pending'/'active'
 * status — those only ever get created by an admin approving a real
 * pendingApprovals request, not by anything a Playwright test can click).
 *
 * Requires FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL /
 * FIREBASE_ADMIN_PRIVATE_KEY in the environment the `playwright test`
 * process runs in (same credentials apps/web/scripts/seed-demo.mjs uses) —
 * these are server-only and never shipped to the browser.
 *
 * All docs created through this helper should be tagged (name/label
 * prefixed `PW_TEST_`) per the no-isolated-test-project convention for this
 * repo — there's a single shared Firebase project, so test data must stay
 * identifiable rather than silently blending into real records.
 */
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const PW_TEST_PREFIX = 'PW_TEST_';

let app: App | undefined;

function adminApp(): App {
  if (app) return app;
  if (getApps().length) { app = getApps()[0]; return app; }

  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY ' +
      'must be set in the environment running `playwright test` to seed Firestore fixtures.',
    );
  }

  app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, 'pw-test-admin');
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export { Timestamp };

/** Deletes a Firestore doc, ignoring "already gone" — safe to call in test cleanup. */
export async function deleteDocSafe(collectionPath: string, id: string) {
  await adminDb().collection(collectionPath).doc(id).delete().catch(() => {});
}

/** Deletes the dev-only bypass Firebase Auth user created for a test UID, ignoring "already gone". */
export async function deleteAuthUserSafe(uid: string) {
  await getAuth(adminApp()).deleteUser(uid).catch(() => {});
}
