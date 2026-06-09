/**
 * Mint a fresh Firebase ID token for a test user.
 * Phone-only users (worker, customer) can't use email/password sign-in,
 * so we use the Admin SDK to create a custom token and exchange it.
 *
 * Usage (run from repo root):
 *   node scripts/get-token.mjs worker
 *   node scripts/get-token.mjs customer
 *   node scripts/get-token.mjs admin
 *   node scripts/get-token.mjs <uid>   ← any explicit UID
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

function loadEnv(filePath) {
  const env = {};
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val   = trimmed.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

const env = loadEnv(resolve(__dirname, '../apps/web/.env.local'));

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const auth    = admin.auth();
const db      = admin.firestore();
const API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const arg     = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/get-token.mjs worker | customer | admin | <uid>');
  process.exit(1);
}

// Resolve named roles to UIDs from Firestore
async function resolveUid(arg) {
  if (arg === 'admin') {
    const snap = await db.collection('admins').limit(1).get();
    if (snap.empty) throw new Error('No admin doc found — run seed.mjs first');
    return snap.docs[0].id;
  }
  if (arg === 'worker') {
    const snap = await db.collection('workers').limit(1).get();
    if (snap.empty) throw new Error('No worker doc found — run seed.mjs first');
    return snap.docs[0].id;
  }
  if (arg === 'customer') {
    const snap = await db.collection('customers').limit(1).get();
    if (snap.empty) throw new Error('No customer doc found — run seed.mjs first');
    return snap.docs[0].id;
  }
  return arg; // treat as literal UID
}

const uid = await resolveUid(arg);

// For admin: email+password sign-in is simpler and avoids custom token overhead
if (arg === 'admin') {
  const adminSnap = await db.collection('admins').doc(uid).get();
  const email     = adminSnap.data()?.email;
  if (!email) throw new Error('Admin doc missing email field');

  const res  = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: 'Admin@123', returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (data.error) throw new Error(`Auth failed: ${data.error.message}`);
  console.log(data.idToken);
  await admin.app().delete();
  process.exit(0);
}

// Worker / Customer: mint a custom token, exchange for ID token
const customToken = await auth.createCustomToken(uid);

const res  = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
  {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token: customToken, returnSecureToken: true }),
  },
);
const data = await res.json();
if (data.error) throw new Error(`Token exchange failed: ${data.error.message}`);

console.log(data.idToken);
await admin.app().delete();
process.exit(0);
