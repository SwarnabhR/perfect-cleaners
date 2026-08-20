/**
 * fix-anil-angel-jupiter-id.mjs — one-off: worker Anil's assignedSocietyNames
 * already had "Angel Jupiter" in it (parallel-array with assignedSocietyIds)
 * pointing at a stale/nonexistent society id (demo_society_mahagun_003,
 * which doesn't exist in societies/ at all). seed-angel-jupiter.mjs just
 * created the real society doc — this repoints that one entry at the real
 * id instead of leaving the stale pairing behind.
 *
 * Usage (from apps/web/): node scripts/fix-anil-angel-jupiter-id.mjs <realSocietyId>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const realSocietyId = process.argv[2];
if (!realSocietyId) {
  console.error('Usage: node scripts/fix-anil-angel-jupiter-id.mjs <realSocietyId>');
  process.exit(1);
}

const envPath = resolve(process.cwd(), '.env.local');
let envVars = {};
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
const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const WORKER_ID = 'FV09wMOZytZKtA2sLhRC1ZI8a212';
const ref = db.collection('workers').doc(WORKER_ID);
const snap = await ref.get();
const w = snap.data();

const names = [...(w.assignedSocietyNames ?? [])];
const ids   = [...(w.assignedSocietyIds ?? [])];
const idx   = names.indexOf('Angel Jupiter');

if (idx === -1) {
  console.log('No "Angel Jupiter" entry found in assignedSocietyNames — nothing to fix.');
  process.exit(0);
}
console.log(`Found "Angel Jupiter" at index ${idx}, currently pointing at id "${ids[idx]}"`);
ids[idx] = realSocietyId;
await ref.update({ assignedSocietyIds: ids });
console.log(`Updated workers/${WORKER_ID}.assignedSocietyIds[${idx}] = "${realSocietyId}"`);
process.exit(0);
