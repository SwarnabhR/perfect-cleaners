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
 * 2. Firebase Auth's default web persistence is IndexedDB, scoped to the
 *    browser context (shared across pages in that context, but invisible to
 *    Playwright's storageState() — this Playwright version does not
 *    serialize IndexedDB). Signing in via the gstatic-loaded instance writes
 *    a session to IndexedDB; the app's own bundled instance only picks it up
 *    on a fresh initialization, i.e. after a reload — same-tab writes don't
 *    fire the storage events that would otherwise notify a live listener.
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
 */
export async function signInWithBypassToken(page: Page, uid: string) {
  const res  = await page.request.get(`/api/test/firebase-token?uid=${uid}`);
  const body = await res.json();
  if (!res.ok()) throw new Error(`firebase-token failed: ${body.error}`);

  await page.evaluate(async ({ token, config }: { token: string; config: Record<string, string | undefined> }) => {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js' as any);
    const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js' as any);
    const app  = initializeApp(config);
    const auth = getAuth(app);
    await signInWithCustomToken(auth, token);
  }, { token: body.token, config: firebaseConfigFromEnv() });

  await page.reload();
}
