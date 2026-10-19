import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/admin-server-auth';
import { writeAdminAudit } from '@/lib/admin-audit';

// Corrects a society customer's details from the staff app. Flat, parking and contact
// details are denormalized onto every cleaningSessions car entry (that is what the worker
// sees on the ground), so an edit here also patches the sessions that have not finished.
// Tower changes are deliberately not supported: they move the customer between sessions
// and fee tiers and need their own flow.

interface Changes {
  customerName?: string; customerPhone?: string;
  unitNumber?: string; parkingNumber?: string; parkingLevel?: string;
  status?: 'active' | 'paused';
}

const TEXT_FIELDS = ['customerName', 'unitNumber', 'parkingNumber', 'parkingLevel'] as const;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
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
    if (Object.keys(update).length === 0 && changes.status === undefined) return badRequest('Nothing to change.');

    const db = adminFirestore();
    const recordRef = db.collection('customerSocietyRecords').doc(recordId);
    const snap = await recordRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Customer record not found.' }, { status: 404 });
    const before = snap.data()!;

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

    const keys = Object.keys(update);
    await writeAdminAudit({
      adminId: admin.uid, action: 'societyRecord.updated', entityType: 'customerSocietyRecord', entityId: recordId,
      summary: `Updated ${before.customerName ?? 'customer'}: ${keys.join(', ')}`,
      before: Object.fromEntries(keys.map(k => [k, before[k] ?? null])),
      after: Object.fromEntries(keys.map(k => [k, typeof update[k] === 'object' ? null : update[k]])),
    });

    return NextResponse.json({ ok: true, sessionsPatched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed.';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    console.error('[update-society-record]', error);
    return NextResponse.json({ error: status === 500 ? 'Update failed.' : message }, { status });
  }
}
