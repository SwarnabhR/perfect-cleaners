import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/admin-server-auth';
import { writeAdminAudit } from '@/lib/admin-audit';
import { resyncUpcomingSessions } from '@/lib/resync-sessions';

// Corrects a society customer's details from the staff app. Flat, parking, cars
// and contact details are denormalized onto every cleaningSessions car entry
// (that is what the worker sees on the ground), so an edit here also patches the
// sessions that have not finished — and a car added/removed is reconciled into
// future sessions via resyncUpcomingSessions.
// Tower changes are deliberately not supported: they move the customer between
// sessions and fee tiers and need their own flow.

interface CarInput {
  plate?: string;
  make?: string;
  model?: string;
  category?: 'car' | 'two-wheeler';
}

interface Changes {
  customerName?: string; customerPhone?: string;
  unitNumber?: string; parkingNumber?: string; parkingLevel?: string;
  status?: 'active' | 'paused';
  tier?: 'normal' | 'premium' | 'ultra';
  cars?: CarInput[];
}

const TEXT_FIELDS = ['customerName', 'unitNumber', 'parkingNumber', 'parkingLevel'] as const;
const TIERS = ['normal', 'premium', 'ultra'] as const;

interface Car {
  plate: string;
  make: string;
  model: string;
  category: 'car' | 'two-wheeler';
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function normalizeCars(input: CarInput[]): Car[] | string {
  if (!Array.isArray(input) || input.length === 0 || input.length > 4) return 'A customer needs 1–4 vehicles.';
  const cars: Car[] = [];
  for (const c of input) {
    const plate = String(c?.plate ?? '').trim().toUpperCase();
    if (!plate) return 'Every vehicle needs a plate.';
    cars.push({
      plate,
      make: String(c?.make ?? '').trim(),
      model: String(c?.model ?? '').trim(),
      category: c?.category === 'two-wheeler' ? 'two-wheeler' : 'car',
    });
  }
  return cars;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers.get('authorization'), ['operations']);
    const { recordId, changes } = await req.json() as { recordId?: string; changes?: Changes };
    if (!recordId || !changes || typeof changes !== 'object') return badRequest('recordId and changes are required.');

    const update: Record<string, unknown> = {};
    const sessionPatch: Record<string, unknown> = {};

    for (const key of TEXT_FIELDS) {
      const v = changes[key];
      if (v === undefined) continue;
      if (typeof v !== 'string' || v.length > 80) return badRequest(`${key} is invalid.`);
      const value = v.trim();
      if ((key === 'customerName' || key === 'unitNumber') && !value) return badRequest(`${key} cannot be empty.`);
      // Optional fields are removed rather than stored empty.
      update[key] = value || FieldValue.delete();
      sessionPatch[key] = value || FieldValue.delete();
    }

    if (changes.customerPhone !== undefined) {
      const digits = String(changes.customerPhone).replace(/\D/g, '').slice(-10);
      if (digits.length !== 10) return badRequest('Phone number must be 10 digits.');
      update.customerPhone = `+91${digits}`;
      sessionPatch.customerPhone = `+91${digits}`;
    }

    if (changes.status !== undefined && changes.status !== 'active' && changes.status !== 'paused') {
      return badRequest('Status can only be set to active or paused.');
    }

    let carsUpdate: Car[] | undefined;
    if (changes.cars !== undefined) {
      const normalized = normalizeCars(changes.cars);
      if (typeof normalized === 'string') return badRequest(normalized);
      carsUpdate = normalized;
      update.cars = normalized;
    }

    if (changes.tier !== undefined && !TIERS.includes(changes.tier)) {
      return badRequest('Invalid tier.');
    }

    if (Object.keys(update).length === 0 && changes.status === undefined) return badRequest('Nothing to change.');

    const db = adminFirestore();
    const recordRef = db.collection('customerSocietyRecords').doc(recordId);
    const snap = await recordRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Customer record not found.' }, { status: 404 });
    const before = snap.data()!;

    // Recompute the monthly fee when the car set or tier changes: tier car fee
    // (or the existing fee when the tower has no tiers) plus the two-wheeler
    // add-on when one is registered — same rule the web enrollment modal uses.
    const oldCars = (before.cars as { category?: string }[] | undefined) ?? [];
    const hadTwoWheeler = oldCars.some(c => c.category === 'two-wheeler');
    if (carsUpdate || changes.tier) {
      const cfgSnap = await db.collection('societyBillingConfig')
        .where('societyId', '==', before.societyId)
        .where('tower', '==', before.tower)
        .get();
      const cfg = cfgSnap.docs[0]?.data();
      const tierPricing = cfg?.tierPricing as { normal: number; premium: number; ultra: number } | undefined;
      const twoWheelerFee = (cfg?.twoWheelerFee as number | undefined) ?? 0;
      const tier = (changes.tier ?? before.tier ?? 'normal') as (typeof TIERS)[number];
      const finalCars = carsUpdate ?? oldCars;
      const hasTwoWheeler = finalCars.some(c => c.category === 'two-wheeler');
      const carFee = tierPricing
        ? tierPricing[tier]
        : Math.max(0, (before.monthlyFee ?? 500) - (hadTwoWheeler ? twoWheelerFee : 0));
      update.monthlyFee = carFee + (hasTwoWheeler ? twoWheelerFee : 0);
      if (changes.tier) update.tier = tier;
    }

    const batch = db.batch();
    if (changes.status !== undefined && changes.status !== before.status) {
      if (before.status !== 'active' && before.status !== 'paused') {
        return NextResponse.json({ error: `A ${before.status} customer cannot be paused or reactivated here.` }, { status: 409 });
      }
      update.status = changes.status;
      // Keep the society counters in step, as the web enrollments page does.
      const carCount = (before.cars as unknown[] | undefined)?.length ?? 1;
      const delta = changes.status === 'active' ? carCount : -carCount;
      batch.update(db.collection('societies').doc(before.societyId), {
        activeResidents: FieldValue.increment(delta),
        vehicleCount: FieldValue.increment(delta),
      });
    }

    // A changed vehicle count moves the society's vehicle tally (and the
    // resident tally when the record is active and merely swapped cars).
    if (carsUpdate && carsUpdate.length !== oldCars.length) {
      batch.update(db.collection('societies').doc(before.societyId), {
        vehicleCount: FieldValue.increment(carsUpdate.length - oldCars.length),
      });
    }

    batch.update(recordRef, { ...update, updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();

    // Patch the denormalized fields on this customer's cars in sessions that have not finished.
    let sessionsPatched = 0;
    if (Object.keys(sessionPatch).length > 0) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const sessions = await db.collection('cleaningSessions')
        .where('societyId', '==', before.societyId)
        .where('tower', '==', before.tower)
        .where('status', 'in', ['scheduled', 'inprogress'])
        .get();
      for (const sessionDoc of sessions.docs) {
        const scheduled = sessionDoc.data().scheduledDate?.toDate?.() as Date | undefined;
        if (scheduled && scheduled < startOfToday) continue;
        try {
          await db.runTransaction(async tx => {
            const fresh = await tx.get(sessionDoc.ref);
            const cars = (fresh.data()?.cars as Record<string, unknown>[] | undefined) ?? [];
            let changed = false;
            const next = cars.map(car => {
              if (car.customerId !== before.customerId) return car;
              changed = true;
              const patched = { ...car };
              for (const [k, v] of Object.entries(sessionPatch)) {
                if (v === undefined || (typeof v === 'object' && v !== null)) delete patched[k]; // FieldValue.delete() sentinel
                else patched[k] = v;
              }
              return patched;
            });
            if (changed) { tx.update(sessionDoc.ref, { cars: next, updatedAt: FieldValue.serverTimestamp() }); sessionsPatched++; }
          });
        } catch (err) {
          console.warn(`[update-society-record] session ${sessionDoc.id} not patched:`, err);
        }
      }
    }

    // Added/removed vehicles: reconcile the customer's rows on future sessions.
    if (carsUpdate) {
      try {
        await resyncUpcomingSessions(recordId, before.societyId, before.tower);
      } catch (err) {
        console.warn('[update-society-record] session resync failed:', err);
      }
    }

    const keys = Object.keys(update);
    await writeAdminAudit({
      adminId: admin.uid, action: 'societyRecord.updated', entityType: 'customerSocietyRecord', entityId: recordId,
      summary: `Updated ${before.customerName ?? 'customer'}: ${keys.join(', ')}`,
      before: Object.fromEntries(keys.map(k => [k, before[k] ?? null])),
      after: Object.fromEntries(keys.map(k => [k, typeof update[k] === 'object' && update[k] !== null && !Array.isArray(update[k]) ? null : update[k]])),
    });

    return NextResponse.json({ ok: true, sessionsPatched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed.';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    console.error('[update-society-record]', error);
    return NextResponse.json({ error: status === 500 ? 'Update failed.' : message }, { status });
  }
}
