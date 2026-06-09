'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Booking, BookingStatus } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import SlideToConfirm from '@/components/ui/SlideToConfirm';

// ─── Status pipeline ──────────────────────────────────────────────────────────

const PIPELINE: BookingStatus[] = ['assigned', 'enroute', 'arrived', 'inprogress', 'done'];

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  assigned:   'On My Way →',
  enroute:    "I've Arrived →",
  arrived:    'Start Job →',
  inprogress: 'Mark Complete →',
};

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  assigned:   'enroute',
  enroute:    'arrived',
  arrived:    'inprogress',
  inprogress: 'done',
};

const STEP_LABEL: Record<BookingStatus, string> = {
  assigned:   'Assigned',
  enroute:    'En Route',
  arrived:    'Arrived',
  inprogress: 'In Progress',
  done:       'Done',
  pending:    'Pending',
  cancelled:  'Cancelled',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useWorkerAuth();

  const [booking,  setBooking]  = useState<(Booking & { id: string; customerName?: string; customerPhone?: string; bookingRef?: string }) | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, 'bookings', id),
      snap => {
        if (snap.exists()) setBooking({ id: snap.id, ...snap.data() } as any);
        setLoading(false);
      },
      () => setLoading(false), // permission-denied on non-existent doc → show "not found"
    );
  }, [id]);

  async function advanceStatus() {
    if (!booking || updating) return;
    const next = NEXT_STATUS[booking.status];
    if (!next) return;
    setUpdating(true);
    await updateDoc(doc(db, 'bookings', id), {
      status:    next,
      updatedAt: serverTimestamp(),
      ...(next === 'done' ? { completedAt: serverTimestamp() } : {}),
    });
    setUpdating(false);
    if (next === 'done') {
      // Fire-and-forget: credit earnings + notify customer (replaces Cloud Function)
      user?.getIdToken().then(token =>
        fetch('/api/worker/job-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            bookingId:  id,
            workerId:   (booking as any).workerId   ?? user?.uid,
            customerId: (booking as any).customerId ?? null,
            total:      booking.priceBreakdown?.total ?? 0,
            serviceIds: (booking as any).serviceIds  ?? [],
          }),
        })
      ).catch(() => {});
      router.replace('/worker/dashboard');
    }
  }

  if (loading) return (
    <div style={{ padding: 'var(--pc-space-20)', textAlign: 'center' }}>
      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>Loading…</span>
    </div>
  );

  if (!booking) return (
    <div style={{ padding: 'var(--pc-space-10)', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg-3)' }}>Booking not found.</p>
    </div>
  );

  const status      = booking.status as BookingStatus;
  const pipeStep    = PIPELINE.indexOf(status);
  const isDone      = status === 'done' || status === 'cancelled';
  const actionLabel = ACTION_LABEL[status];

  const scheduledAt = (booking.scheduledAt as any)?.toDate?.() ?? new Date(booking.scheduledAt ?? 0);
  const phone = booking.customerPhone?.replace('+91', '').replace(/\D/g, '') ?? '';

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg) var(--pc-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 'var(--pc-space-3)' }}>
        <button type="button" onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-3)', display: 'flex', padding: 0 }}>
          <Icon name="arrow-left" size={20} color="currentColor" />
        </button>
        <div>
          <Eyebrow>{booking.bookingRef ?? id.slice(0, 8).toUpperCase()}</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 24, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            {(booking.serviceIds?.[0] ?? 'Service').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </h1>
        </div>
      </div>

      {/* Status pipeline */}
      <Card style={{ padding: 'var(--pc-space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {PIPELINE.map((s, i) => {
            const done    = i <= pipeStep;
            const current = i === pipeStep;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < PIPELINE.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                    border: `2px solid ${current ? 'var(--pc-sage-hi)' : done ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: current ? 'var(--pc-shadow-glow-sage)' : 'none',
                  }}>
                    {done && !current && <Icon name="check" size={12} color="var(--pc-sage-ink)" />}
                    {current && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pc-sage-ink)' }} />}
                  </div>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 9, color: done ? 'var(--pc-fg-2)' : 'var(--pc-fg-4)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                    {STEP_LABEL[s]}
                  </span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < pipeStep ? 'var(--pc-sage)' : 'var(--pc-line)', margin: '0 4px', marginTop: -12 }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Customer info */}
      <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
        <Eyebrow>CUSTOMER</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 4px' }}>
              {booking.customerName ?? '—'}
            </p>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.04em' }}>
              +91 {phone.slice(0, 5)} {phone.slice(5)}
            </p>
          </div>
          {phone && (
            <a href={`tel:+91${phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999,
              background: 'var(--pc-sage-subtle)', border: '1px solid rgba(74,94,68,0.3)',
              textDecoration: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600,
              color: 'var(--pc-sage-hi)',
            }}>
              <Icon name="phone" size={13} color="currentColor" />
              Call
            </a>
          )}
        </div>
      </Card>

      {/* Job details */}
      <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
        <Eyebrow>JOB DETAILS</Eyebrow>
        {[
          { icon: 'clock',        label: 'Scheduled', value: scheduledAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
          { icon: 'map-pin',      label: 'Address',   value: (() => {
            const a = booking.address as any;
            if (a?.societyName) {
              return [a.flatNo && `Flat ${a.flatNo}`, a.tower, a.societyName].filter(Boolean).join(', ');
            }
            return [a?.line1, a?.city, a?.pincode].filter(Boolean).join(', ');
          })() },
          { icon: 'car',          label: 'Vehicle',   value: [booking.vehicle?.make, booking.vehicle?.model, booking.vehicle?.registration].filter(Boolean).join(' · ') },
          { icon: 'indian-rupee', label: 'Amount',    value: `₹${(booking.priceBreakdown?.total ?? 0).toLocaleString('en-IN')} (${(booking as any).paymentStatus === 'paid' ? 'paid' : 'pay at service'})` },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name={icon} size={14} color="var(--pc-fg-4)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: '0 0 2px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0, lineHeight: 1.4 }}>{value || '—'}</p>
            </div>
          </div>
        ))}
      </Card>


      {/* Action button */}
      {!isDone && actionLabel && (
        <SlideToConfirm
          label={actionLabel}
          onConfirm={advanceStatus}
          loading={updating}
          variant={status === 'inprogress' ? 'sage' : 'warm'}
        />
      )}

      {isDone && (
        <Card style={{ padding: 'var(--pc-space-5)', textAlign: 'center', background: 'rgba(111,174,106,0.1)', border: '1px solid rgba(111,174,106,0.3)' }}>
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-success)', margin: '0 0 4px' }}>Job {status === 'done' ? 'completed!' : 'cancelled.'}</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
            {status === 'done' ? 'Great work. Collect payment from the customer.' : 'This job was cancelled.'}
          </p>
        </Card>
      )}
    </div>
  );
}
