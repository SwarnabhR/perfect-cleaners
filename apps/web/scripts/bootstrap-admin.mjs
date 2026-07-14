/**
 * bootstrap-admin.mjs — creates an admin Firebase Auth user + admins/{uid} doc.
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs <email> <password> [username]
 *
 * `username` is what the admin actually types in at /login — it's just a
 * friendly wrapper resolved server-side to the real `email` before signing
 * in with Firebase Auth. Defaults to the part of the email before the "@".
 *
 * Run this once per admin account, then log in at /login.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');

let envVars = {};
try {
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1');
    envVars[key] = val;
  }
} catch {
  console.error('❌  Could not read apps/web/.env.local');
  process.exit(1);
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌  Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

const [email, password, usernameArg] = process.argv.slice(2);

if (!email || !password) {
  console.error(`
Usage: node scripts/bootstrap-admin.mjs <email> <password> [username]

Example:
  node scripts/bootstrap-admin.mjs admin@perfectcleaners.in MySecurePass123 admin
`);
  process.exit(1);
}

const username = (usernameArg || email.split('@')[0]).trim().toLowerCase();

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getAuth }      = await import('firebase-admin/auth');
const { getFirestore } = await import('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const adminAuth = getAuth();
const db        = getFirestore();

console.log(`\n🔧  Bootstrapping admin account for ${email}…\n`);

// Find or create the Firebase Auth user
let uid;
try {
  const existing = await adminAuth.getUserByEmail(email);
  uid = existing.uid;
  // Update password in case it changed
  await adminAuth.updateUser(uid, { password });
  console.log(`  ✓  Found existing Firebase Auth user  (uid: ${uid})`);
} catch (e) {
  if (e.code === 'auth/user-not-found') {
    const created = await adminAuth.createUser({ email, password, emailVerified: true });
    uid = created.uid;
    console.log(`  ✓  Created new Firebase Auth user  (uid: ${uid})`);
  } else {
    throw e;
  }
}

// Usernames must be unique across admins/{uid} docs (other than this one)
const clash = await db.collection('admins').where('username', '==', username).get();
const takenByOther = clash.docs.find(d => d.id !== uid);
if (takenByOther) {
  console.error(`❌  Username "${username}" is already taken by admins/${takenByOther.id}`);
  process.exit(1);
}

// Create or update the admins/{uid} document
const adminRef = db.collection('admins').doc(uid);
await adminRef.set({ email, username, createdAt: new Date() }, { merge: true });
console.log(`  ✓  admins/${uid}  written  (username: ${username})`);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Username ${username}
  Password ${password}
  Email    ${email}
  UID      ${uid}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Admin ready. Sign in at http://localhost:3000/login
`);

process.exit(0);
