/**
 * Shared helper for the dev-only /api/test/firebase-token bypass (see that
 * route for details — it's hard-blocked in production).
 *
 * Two things make this non-trivial:
 *
 * 1. The app's own Firebase SDK is bundled via webpack ('self', allowed by
 *    CSP). To sign in without touching MSG91, we dynamically import the SDK
 *    from gstatic.com inside the page instead — that's a SEPARATE module
 *    registry from the app's bundled one, so getApps() there is always
 *    empty. We must initializeApp() with the same public config ourselves.
 *
 * 2. Persistence must match what the app itself uses, or its own Auth
 *    instance won't find the session after reload even in the same tab:
 *      - Customer (CustomerAuthContext.tsx, /signin) explicitly calls
 *        setPersistence(auth, browserSessionPersistence) — sessionStorage,
 *        scoped per TAB. A new Playwright `page` (= new tab) starts with
 *        empty sessionStorage even in an already-signed-in context, so
 *        customer tests must additionally reuse the SAME page across a
 *        worker's tests (see tests/fixtures/customer.ts), not just the
 *        same context.
 *      - Worker/admin never call setPersistence, so they get Firebase's
 *        default (indexedDB, shared across tabs in the same context) — pass
 *        no `persistence` option for those.
 */
import type { Page } from '@playwright/test';

export function firebaseConfigFromEnv() {
  return {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * Signs in as `uid` on whatever page is currently loaded, then reloads so
 * the app's own auth listener picks up the session. Caller navigates to the
 * right entry page (`/signin`, `/worker/login`, ...) and waits for the
 * post-login redirect afterwards — this only performs the sign-in itself.
 *
 * Pass `persistence: 'session'` for customer flows (matches
 * CustomerAuthContext's browserSessionPersistence) — omit it for worker/admin,
 * which use Firebase's default (indexedDB) persistence.
 */
export async function signInWithBypassToken(
  page: Page,
  uid: string,
  opts: { persistence?: 'session' } = {},
) {
  const res  = await page.request.get(`/api/test/firebase-token?uid=${uid}`);
  const body = await res.json();
  if (!res.ok()) throw new Error(`firebase-token failed: ${body.error}`);

  await page.evaluate(async ({ token, config, useSessionPersistence }: {
    token: string; config: Record<string, string | undefined>; useSessionPersistence: boolean;
  }) => {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js' as any);
    const { getAuth, setPersistence, browserSessionPersistence, signInWithCustomToken } =
      await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js' as any);
    const app  = initializeApp(config);
    const auth = getAuth(app);
    if (useSessionPersistence) await setPersistence(auth, browserSessionPersistence);
    await signInWithCustomToken(auth, token);
  }, { token: body.token, config: firebaseConfigFromEnv(), useSessionPersistence: opts.persistence === 'session' });

  await page.reload();
}
