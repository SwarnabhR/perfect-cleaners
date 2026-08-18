import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/admin-server-auth';
import { writeAdminAudit } from '@/lib/admin-audit';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers.get('authorization'), ['billing']);
    const { kind, recordId, customerId, amount, customerName } = await req.json() as { kind?: 'society' | 'balance'; recordId?: string; customerId?: string; amount?: number; customerName?: string };
    if (!kind || !customerId || !Number.isFinite(amount) || amount! <= 0 || (kind === 'society' && !recordId)) return NextResponse.json({ error: 'Invalid payment details.' }, { status: 400 });
    const paymentAmount = amount as number;
    const db = adminFirestore();
    const payment = db.collection('paymentLogs').doc();
    await db.runTransaction(async tx => {
      const stats = db.doc('stats/income');
      const statsSnap = await tx.get(stats);
      if (kind === 'society') {
        const dueRef = db.collection('customerSocietyRecords').doc(recordId!);
        const due = await tx.get(dueRef);
        if (!due.exists || due.data()?.paymentStatus === 'paid') throw new Error('ALREADY_SETTLED');
        tx.update(dueRef, { paymentStatus: 'paid', pendingAmount: 0, updatedAt: FieldValue.serverTimestamp() });
      } else {
        const customerRef = db.collection('customers').doc(customerId);
        const customer = await tx.get(customerRef);
        if (!customer.exists || (customer.data()?.outstandingBalance ?? 0) <= 0) throw new Error('ALREADY_SETTLED');
        tx.update(customerRef, { outstandingBalance: 0, updatedAt: FieldValue.serverTimestamp() });
      }
      tx.set(payment, { customerId, customerName: customerName ?? '', amount: paymentAmount, type: 'manual_dues', paidAt: FieldValue.serverTimestamp(), recordedBy: admin.uid });
      tx.set(stats, { totalIncome: FieldValue.increment(paymentAmount), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    await writeAdminAudit({ adminId: admin.uid, action: 'payment.recorded', entityType: kind === 'society' ? 'customerSocietyRecord' : 'customer', entityId: recordId ?? customerId, summary: `Recorded ₹${paymentAmount} manual payment`, after: { customerId, amount: paymentAmount, kind } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment could not be recorded.';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : message === 'ALREADY_SETTLED' ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Payment could not be recorded.' : message }, { status });
  }
}
