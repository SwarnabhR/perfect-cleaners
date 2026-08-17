/**
 * seed-fake-customers.mjs — adds fake society customers for testing the
 * worker + admin workflows on the live project, assigns them to workers
 * (most to Anil +919711241629), and rebuilds the next week of cleaning
 * sessions so workers see the cars in their real-time UI.
 *
 * Usage (from apps/web/):
 *   node scripts/seed-fake-customers.mjs
 *
 * Records/customers are skipped if they already exist; sessions are rebuilt
 * (deterministic IDs) so today + the next 6 days carry the current cars.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANIL_ID, ANIL_NAME, ANIL_PHONE,
  WORKERS, TOWER_WORKERS, FAKE_CUSTOMERS, PENDING_APPROVALS,
} from './fake-customers-data.mjs';

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
  console.error('Could not read apps/web/.env.local');
  process.exit(1);
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = await import('firebase-admin/firestore');

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const db = getFirestore();

function dateKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function towerSlug(tower) {
  return tower.trim().replace(/\s+/g, '-');
}

function digitsOf(phone) {
  return (phone || '').replace(/\D/g, '');
}

// ── 1. Rename the Anil worker ─────────────────────────────────────────────────

async function renameAnil() {
  console.log('\n── 1. Rename worker to Anil ───────────────────────────────────');
  const wRef = db.collection('workers').doc(ANIL_ID);
  if ((await wRef.get()).exists) {
    await wRef.update({ name: ANIL_NAME, phone: ANIL_PHONE });
    console.log(`  ✓  workers/${ANIL_ID}  → ${ANIL_NAME} (${ANIL_PHONE})`);
  } else {
    console.log(`  ✗  workers/${ANIL_ID} missing — create via /api/admin/create-worker first`);
  }
  const cRef = db.collection('customers').doc(ANIL_ID);
  if ((await cRef.get()).exists) {
    await cRef.update({ name: ANIL_NAME, phone: ANIL_PHONE });
    console.log(`  ✓  customers/${ANIL_ID}  → ${ANIL_NAME}`);
  }
}

// ── 2. Upsert customerSocietyRecords + customers docs ─────────────────────────

async function readBillingConfigs() {
  const snap = await db.collection('societyBillingConfig').get();
  const out = new Map();
  for (const d of snap.docs) {
    const x = d.data();
    out.set(`${x.societyId}|${x.tower}`, x);
  }
  return out;
}

async function seedCustomers(billingConfigs) {
  console.log('\n── 2. customerSocietyRecords + customers ──────────────────────');
  let created = 0, skipped = 0;
  const deltas = new Map();

  for (const c of FAKE_CUSTOMERS) {
    const digits = digitsOf(c.customerPhone);
    const customerId = `admin_${digits}`;
    const recordId = `${customerId}_${c.societyId}_${c.tower}`;
    const recordRef = db.collection('customerSocietyRecords').doc(recordId);
    const recExists = (await recordRef.get()).exists;

    const config = billingConfigs.get(`${c.societyId}|${c.tower}`);
    const monthlyFee = (c.tier && config?.tierPricing?.[c.tier])
      ? config.tierPricing[c.tier]
      : (config?.monthlyFee ?? 500);

    const societyName = config?.societyName ?? c.societyName ?? '';
    const skipDates = (c.skipDates ?? []).map(s => Timestamp.fromDate(new Date(`${s}T00:00:00`)));
    const rescheduledSlots = (c.rescheduledSlots ?? []).map(r => ({
      date: Timestamp.fromDate(new Date(`${r.date}T00:00:00`)) ,
      fromTime: r.fromTime,
      toTime: r.toTime,
    }));

    const data = {
      customerId,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      societyId: c.societyId,
      societyName,
      tower: c.tower,
      unitNumber: c.unitNumber,
      parkingNumber: c.parkingNumber,
      cars: c.cars,
      preferredCleaningTime: c.preferredCleaningTime,
      preferredCleaningDays: c.preferredCleaningDays,
      signupSource: 'bulk_import',
      status: 'active',
      tier: c.tier,
      billingFrequency: c.billingFrequency,
      deepCleanEnabled: false,
      monthlyFee,
      nextBillingDate: Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)),
      paymentStatus: c.paymentStatus,
      paymentMethod: c.paymentMethod,
      paymentNotes: `Seeded test customer · ${c.tier ?? 'normal'} tier`,
      skipDates,
      rescheduledSlots,
      ...(c.permanentTime != null ? { permanentTime: c.permanentTime } : {}),
    };

    if (recExists) {
      await recordRef.update({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      skipped++;
      console.log(`  ~  ${recordId}  (updated ${c.customerName})`);
    } else {
      await recordRef.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      created++;
      console.log(`  ✓  ${recordId}  (${c.customerName} → ${societyName} · ${c.tower})`);
    }

    // customers collection doc (for the admin /customers page)
    const custRef = db.collection('customers').doc(customerId);
    if (!(await custRef.get()).exists) {
      await custRef.set({
        id: customerId,
        name: c.customerName,
        phone: c.customerPhone,
        email: `${digits}@example.com`,
        role: 'customer',
        onboardingComplete: true,
        vehicles: c.cars.map((v, i) => ({
          id: `v${i + 1}`,
          make: v.make,
          model: v.model,
          year: 2022,
          type: 'sedan',
          registration: v.plate,
          color: 'Black',
        })),
        societyId: c.societyId,
        societyName,
        unitNumber: c.unitNumber,
        tower: c.tower,
        walletBalance: 0,
        outstandingBalance: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Track society counters for the increment pass
    const k = c.societyId;
    const cur = deltas.get(k) || { residents: 0, vehicles: 0 };
    deltas.set(k, { residents: cur.residents + 1, vehicles: cur.vehicles + c.cars.length });
  }

  for (const [societyId, d] of deltas) {
    await db.collection('societies').doc(societyId).update({
      activeResidents: FieldValue.increment(d.residents),
      vehicleCount: FieldValue.increment(d.vehicles),
    });
    console.log(`  ↻  societies/${societyId}  activeResidents +${d.residents}, vehicleCount +${d.vehicles}`);
  }
  return { created, skipped };
}

// ── 3. Pending self-signups ───────────────────────────────────────────────────

async function seedPendingApprovals() {
  console.log('\n── 3. pendingApprovals ────────────────────────────────────────');
  let created = 0;
  for (const a of PENDING_APPROVALS) {
    const ref = db.collection('pendingApprovals').doc(a.id);
    if ((await ref.get()).exists) {
      console.log(`  ~  pendingApprovals/${a.id}  (exists)`);
      continue;
    }
    await ref.set({
      ...a,
      status: 'pending',
      submittedAt: Timestamp.fromMillis(Date.now() - 2 * 86_400_000),
    });
    created++;
    console.log(`  ✓  pendingApprovals/${a.id}  (${a.customerName} → ${a.societyName} · ${a.tower})`);
  }
  return { created };
}

// ── 4. Rebuild cleaning sessions for the next 7 days ──────────────────────────

async function seedSessions(billingConfigs) {
  console.log('\n── 4. cleaningSessions (today → +6 days) ─────────────────────');
  let created = 0, skipped = 0;

  const today = startOfDay(new Date());
  const end = addDays(today, 6);

  // All active records, indexed by societyId|tower, so session cars always
  // reflect the full roster (fake + pre-existing active customers).
  const recsSnap = await db.collection('customerSocietyRecords').get();
  const byKey = new Map();
  for (const d of recsSnap.docs) {
    const x = d.data();
    if (x.status !== 'active') continue;
    const key = `${x.societyId}|${x.tower}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(x);
  }

  for (const [societyId, towerMap] of Object.entries(TOWER_WORKERS)) {
    const societyName = (await db.collection('societies').doc(societyId).get()).data()?.name ?? societyId;
    for (const [tower, workerKeys] of Object.entries(towerMap)) {
      const config = billingConfigs.get(`${societyId}|${tower}`);
      const cleaningDays = config?.cleaningDays?.length ? config.cleaningDays : [];
      const slug = towerSlug(tower);
      const workerIds = workerKeys.map(k => WORKERS[k].id);
      const workerNames = workerKeys.map(k => WORKERS[k].name);
      const records = byKey.get(`${societyId}|${tower}`) || [];

      for (let i = 0; i <= 6; i++) {
        const date = addDays(today, i);
        if (cleaningDays.length && !cleaningDays.includes(date.getDay())) continue;
        const dk = dateKey(date);

        // Build cars for this date, mirroring generate-sessions cron logic.
        const cars = [];
        let skippedCars = 0;
        for (const r of records) {
          const car = r.cars?.[0];
          if (!car) continue;
          if (r.preferredCleaningDays?.length && !r.preferredCleaningDays.includes(date.getDay())) continue;

          const isSkipped = (r.skipDates || []).some(s =>
            new Date(s.toDate ? s.toDate() : s).toDateString() === date.toDateString());

          const resched = (r.rescheduledSlots || []).find(s =>
            new Date(s.date.toDate ? s.date.toDate() : s.date).toDateString() === date.toDateString());

          cars.push({
            customerId: r.customerId,
            customerName: r.customerName || '',
            customerPhone: r.customerPhone || '',
            unitNumber: r.unitNumber || '',
            parkingNumber: r.parkingNumber || '',
            carPlate: car.plate,
            carMake: car.make,
            carModel: car.model,
            preferredTime: resched ? resched.toTime : (r.permanentTime ?? r.preferredCleaningTime ?? 9),
            status: isSkipped ? 'skipped' : 'pending',
          });
          if (isSkipped) skippedCars++;
        }

        const sessionId = `${societyId}_${slug}_${dk}`;
        await db.collection('cleaningSessions').doc(sessionId).set({
          societyId,
          societyName,
          tower,
          scheduledDate: Timestamp.fromDate(date),
          status: 'scheduled',
          cars,
          totalCars: cars.length - skippedCars,
          completedCars: 0,
          skippedCars,
          workerIds,
          workerNames,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        created++;
        const todayFlag = date.getTime() === today.getTime() ? ' ← TODAY' : '';
        console.log(`  ✓  ${sessionId}  (${cars.length} cars, workers: ${workerNames.join(', ') || 'none'})${todayFlag}`);
      }
    }
  }
  return { created, skipped };
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log('\n🔧  Seeding fake society customers + sessions…\n');

await renameAnil();
const billingConfigs = await readBillingConfigs();
const custRes = await seedCustomers(billingConfigs);
const apprRes = await seedPendingApprovals();
const sessRes = await seedSessions(billingConfigs);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Worker rename     — done (Anil +919711241629)
  Customers         — ${custRes.created} created, ${custRes.skipped} updated
  Pending approvals — ${apprRes.created} created
  Sessions          — ${sessRes.created} rebuilt
  ──────────────────────────────────
  Distribution: most cars assigned to Anil; Ravi, Aakash, Deepak,
  Suresh and Manoj cover the remaining towers.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
process.exit(0);
