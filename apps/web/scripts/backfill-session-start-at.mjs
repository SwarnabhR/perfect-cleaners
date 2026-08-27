/**
 * backfill-session-start-at.mjs — stamps `startAt` onto cleaningSessions that
 * were created before that field existed.
 *
 * WHY THIS IS MANDATORY: start-sessions now finds due sessions with
 *   .where('status','==','scheduled').where('startAt','<=', now)
 * and Firestore EXCLUDES documents that lack the inequality field entirely.
 * A pre-existing session with no startAt is therefore invisible to that job —
 * it would never auto-start, and nothing would report an error. The cron would
 * keep returning success while workers waited on sessions that never began.
 *
 * Run this BEFORE deploying the app change (and after the composite index on
 * cleaningSessions (status, startAt) has finished building).
 *
 *   node scripts/backfill-session-start-at.mjs --dry-run   # report only
 *   node scripts/backfill-session-start-at.mjs             # write
 *
 * Idempotent: sessions that already carry a startAt are skipped, so it is safe
 * to re-run. Only 'scheduled' sessions are touched — one already inprogress or
 * done has had its moment, and stamping it would misrepresent history.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');

const envPath = resolve(process.cwd(), '.env.local');
const envVars = {};
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  envVars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1');
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

// ── Kept in sync with packages/firebase/src/sessionTime.ts ─────────────────
// Duplicated rather than imported: @pc/firebase ships raw TypeScript and its
// index pulls in the Firebase *client* SDK, neither of which a plain node
// script can load. Change one, change the other.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DEFAULT_START_MINUTES = 7 * 60;

function parseStartMinutes(schedule) {
  const match = schedule?.match(/(?:·|\|)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
    ?? schedule?.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function resolveTowerStartMinutes(config) {
  if (typeof config?.cleaningTimeMinutes === 'number') return config.cleaningTimeMinutes;
  return parseStartMinutes(config?.cleaningSchedule) ?? DEFAULT_START_MINUTES;
}

function computeSessionStartAt(cleaningDate, startMinutes) {
  return new Date(startOfIstDay(cleaningDate).getTime() + startMinutes * 60_000);
}

function startOfIstDay(d) {
  const asIst = new Date(d.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(asIst.getUTCFullYear(), asIst.getUTCMonth(), asIst.getUTCDate()) - IST_OFFSET_MS);
}
// ───────────────────────────────────────────────────────────────────────────

const ist = (d) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().replace('T', ' ').slice(0, 16) + ' IST';

console.log(DRY_RUN ? 'DRY RUN — no writes\n' : 'WRITING\n');

// One read of every tower config up front, then resolved from memory — the
// alternative is one config query per session.
const configSnap = await db.collection('societyBillingConfig').get();
const startMinutesByTower = new Map();
for (const d of configSnap.docs) {
  const c = d.data();
  if (!c.societyId || !c.tower) continue;
  startMinutesByTower.set(`${c.societyId}::${c.tower}`, resolveTowerStartMinutes(c));
}
console.log(`tower configs loaded: ${startMinutesByTower.size}`);

const sessionSnap = await db.collection('cleaningSessions').where('status', '==', 'scheduled').get();
console.log(`scheduled sessions:  ${sessionSnap.size}\n`);

let stamped = 0, alreadySet = 0, noDate = 0, usedDefault = 0;
const pending = [];

for (const d of sessionSnap.docs) {
  const s = d.data();
  if (s.startAt) { alreadySet++; continue; }

  const scheduled = s.scheduledDate?.toDate?.();
  if (!scheduled) {
    noDate++;
    console.warn(`  !! ${d.id} — no scheduledDate, cannot stamp; it will never auto-start`);
    continue;
  }

  const key = `${s.societyId}::${s.tower}`;
  let startMinutes = startMinutesByTower.get(key);
  if (startMinutes === undefined) {
    // Mirrors the runtime fallback rather than skipping: a session left
    // unstamped is one that silently never starts.
    startMinutes = DEFAULT_START_MINUTES;
    usedDefault++;
    console.warn(`  ?  ${d.id} — no billing config for ${key}, defaulting to 07:00 IST`);
  }

  const startAt = computeSessionStartAt(scheduled, startMinutes);
  pending.push({ ref: d.ref, startAt, id: d.id });
  stamped++;
}

pending.slice(0, 10).forEach(p => console.log(`   ${p.id}  ->  ${ist(p.startAt)}`));
if (pending.length > 10) console.log(`   … and ${pending.length - 10} more`);

if (!DRY_RUN && pending.length > 0) {
  const CHUNK = 450;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch = db.batch();
    pending.slice(i, i + CHUNK).forEach(p => batch.update(p.ref, { startAt: p.startAt }));
    await batch.commit();
  }
}

console.log(`\nstamped: ${stamped}${DRY_RUN ? ' (would be)' : ''} | already set: ${alreadySet} | no scheduledDate: ${noDate} | fell back to 07:00: ${usedDefault}`);
if (noDate > 0) console.log('WARNING: sessions without scheduledDate cannot be stamped and will never auto-start. Investigate them.');
process.exit(0);
