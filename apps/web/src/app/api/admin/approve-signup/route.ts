import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/admin-server-auth';
import { writeAdminAudit } from '@/lib/admin-audit';
import { resyncUpcomingSessions } from '@/lib/resync-sessions';
import { sendAndStoreSMS } from '@/lib/notify-sms';

// Server-side counterpart of pending-approvals' handleApprove, used by the
// staff mobile app so the activation rules (fee lookup, record activation,
// society counters, session backfill, approval SMS) live in one place instead
// of being re-implemented in the app.

// The monthly-billing cron bills every active record on the 1st of the month,
// so a record's first real bill always lands on the next 1st.
function firstOfNextMonth(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers.get('authorization'), ['operations']);
    const { approvalId, paymentMethod, paymentNotes } = await req.json() as {
      approvalId?: string; paymentMethod?: string; paymentNotes?: string;
    };
    if (!approvalId || !paymentMethod?.trim()) {
      return NextResponse.json({ error: 'approvalId and paymentMethod are required.' }, { status: 400 });
    }

    const db = adminFirestore();
    const approvalRef = db.collection('pendingApprovals').doc(approvalId);
    const approvalSnap = await approvalRef.get();
    if (!approvalSnap.exists) return NextResponse.json({ error: 'Approval not found.' }, { status: 404 });
    const approval = approvalSnap.data()!;
    if (approval.status !== 'pending') return NextResponse.json({ error: 'This request was already handled.' }, { status: 409 });

    const customerId = (approval.customerId as string | undefined) || `customer_${approvalId}`;

    const configSnap = await db.collection('societyBillingConfig')
      .where('societyId', '==', approval.societyId)
      .where('tower', '==', approval.tower)
      .limit(1).get();
    const billingConfig = configSnap.docs[0]?.data();
    const tierPricing = billingConfig?.tierPricing as { normal: number; premium: number; ultra: number } | undefined;
    const monthlyFee = (approval.tier && tierPricing ? tierPricing[approval.tier as 'normal' | 'premium' | 'ultra'] : undefined)
      ?? (billingConfig?.monthlyFee as number | undefined) ?? 500;
    const cleaningSchedule = (billingConfig?.cleaningSchedule as string | undefined) ?? 'Mon, Wed, Fri · 9:00 AM';
    const twoWheelerFee = (billingConfig?.twoWheelerFee as number | undefined) ?? 0;

    const cars = [
      { plate: approval.carPlate, make: approval.carMake, model: approval.carModel, category: 'car' as const },
      ...(approval.twoWheelerPlate
        ? [{ plate: approval.twoWheelerPlate, make: approval.twoWheelerMake ?? '', model: approval.twoWheelerModel ?? '', category: 'two-wheeler' as const }]
        : []),
    ];

    // Self-signup already created a 'pending' record with an auto-generated ID — activate that
    // same doc so the customer's own page does not keep resolving to the stale pending one.
    const existingSnap = await db.collection('customerSocietyRecords')
      .where('customerId', '==', customerId)
      .where('societyId', '==', approval.societyId)
      .where('tower', '==', approval.tower)
      .limit(1).get();
    const existing = existingSnap.docs[0];
    const recordId = existing?.id ?? `${customerId}_${approval.societyId}_${approval.tower}`;
    const recordRef = db.collection('customerSocietyRecords').doc(recordId);

    const activeFields = {
      customerId,
      customerName: approval.customerName,
      customerPhone: approval.customerPhone,
      societyId: approval.societyId,
      societyName: approval.societyName,
      tower: approval.tower,
      cars,
      preferredCleaningTime: approval.preferredCleaningTime,
      preferredCleaningDays: approval.preferredCleaningDays ?? [],
      signupSource: 'self_signup',
      status: 'active',
      ...(approval.tier ? { tier: approval.tier } : {}),
      billingFrequency: (billingConfig?.billingFrequency as string | undefined) ?? 'monthly',
      deepCleanEnabled: false,
      deepCleanAvailable: !!billingConfig?.deepClean,
      deepCleanFrequency: billingConfig?.deepClean?.frequency ?? 'weekly',
      monthlyFee: monthlyFee + (approval.twoWheelerPlate ? twoWheelerFee : 0),
      nextBillingDate: Timestamp.fromDate(firstOfNextMonth()),
      paymentStatus: 'verified',
      paymentMethod: paymentMethod.trim(),
      paymentNotes: paymentNotes?.trim() ?? '',
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    if (existing) batch.update(recordRef, activeFields);
    else batch.set(recordRef, { ...activeFields, skipDates: [], rescheduledSlots: [], createdAt: FieldValue.serverTimestamp() });
    batch.set(approvalRef, { status: 'approved', approvedAt: FieldValue.serverTimestamp(), approvedBy: admin.uid }, { merge: true });
    // Count the resident once only; re-activating an already-active record must not double count.
    if (!existing || existing.data().status !== 'active') {
      batch.update(db.collection('societies').doc(approval.societyId), {
        activeResidents: FieldValue.increment(1),
        vehicleCount: FieldValue.increment(cars.length),
      });
    }
    await batch.commit();

    await writeAdminAudit({
      adminId: admin.uid, action: 'signup.approved', entityType: 'pendingApproval', entityId: approvalId,
      summary: `Approved ${approval.customerName} for ${approval.societyName} ${approval.tower}`,
      after: { recordId, monthlyFee: activeFields.monthlyFee },
    });

    // Best-effort follow-ups: the record is already active whether or not these succeed.
    const warnings: string[] = [];
    try { await resyncUpcomingSessions(recordId, approval.societyId, approval.tower); }
    catch (err) { warnings.push('Cleaning sessions could not be updated.'); console.warn('[approve-signup] resync failed:', err); }

    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const sms = await sendAndStoreSMS({
      type: 'approval',
      recipientPhone: approval.customerPhone,
      recipientName: approval.customerName,
      data: { customerId: approval.customerPhone, societyName: approval.societyName, tower: approval.tower, schedule: cleaningSchedule, startDate },
    }).catch(() => ({ success: false }));
    if (!sms.success) warnings.push('Approval SMS could not be sent.');

    return NextResponse.json({ ok: true, recordId, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Approval failed.';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    console.error('[approve-signup]', error);
    return NextResponse.json({ error: status === 500 ? 'Approval failed.' : message }, { status });
  }
}
