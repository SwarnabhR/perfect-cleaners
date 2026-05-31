'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';

// ─── Plan metadata ────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { name: string; prices: Record<string, number>; features: string[] }> = {
  starter: {
    name: 'Starter',
    prices: { weekly: 899, monthly: 2999, yearly: 29999 },
    features: ['Weekly Exterior Wash', 'Tyre dressing & shine', 'Interior dashboard wipe-down', '10% off on-demand bookings'],
  },
  pro: {
    name: 'Pro',
    prices: { weekly: 1499, monthly: 4999, yearly: 49999 },
    features: ['Weekly Premium Wash', 'Full interior vacuum & steam clean', 'Leather & dashboard conditioning', 'Spray wax protection', '20% off Ceramic & PPF'],
  },
  elite: {
    name: 'Elite',
    prices: { weekly: 2499, monthly: 7999, yearly: 79999 },
    features: ['Weekly Full Detail', 'Paint decontamination (bi-weekly)', 'Quarterly ceramic nano-coat boost', 'Free pickup & drop-off'],
  },
};

const CYCLE_LABEL: Record<string, string> = { weekly: 'wk', monthly: 'mo', yearly: 'yr' };
const CYCLE_FULL:  Record<string, string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['Morning (9 AM – 12 PM)', 'Afternoon (12 PM – 3 PM)', 'Evening (3 PM – 6 PM)'];

const BRANDS = [
  'Datsun', 'Force Motors', 'Honda', 'Hyundai', 'Isuzu', 'Kia', 'Mahindra',
  'Maruti Suzuki', 'MG', 'OLA Electric', 'Tata', 'Chevrolet', 'Citroën',
  'Fiat', 'Ford', 'Jeep', 'Nissan', 'Renault', 'Skoda', 'Toyota',
  'Volkswagen', 'Audi', 'BMW', 'BYD', 'Haval', 'Lexus', 'MINI', 'Volvo',
  'Aston Martin', 'Bentley', 'Ferrari', 'Jaguar', 'Lamborghini',
  'Land Rover', 'Maserati', 'McLaren', 'Mercedes-Benz', 'Porsche',
  'Rolls-Royce', 'Other',
].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

// ─── Input style ──────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)',
  borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
};

function Label({ children }: { children: string }) {
  return (
    <label style={{
      display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--pc-fg-3)', marginBottom: 8,
    }}>{children}</label>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscribeFlow() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, profileName } = useCustomerAuth();

  const planId = searchParams.get('plan')  ?? 'pro';
  const cycle  = searchParams.get('cycle') ?? 'monthly';
  const plan   = PLAN_META[planId] ?? PLAN_META['pro'];
  const price  = plan.prices[cycle] ?? plan.prices['monthly'];

  const [authOpen, setAuthOpen] = useState(false);
  const [brand,    setBrand]    = useState('');
  const [model,    setModel]    = useState('');
  const [plate,    setPlate]    = useState('');
  const [line1,    setLine1]    = useState('');
  const [city,     setCity]     = useState('');
  const [pincode,  setPincode]  = useState('');
  const [day,      setDay]      = useState('Monday');
  const [slot,     setSlot]     = useState(SLOTS[0]);
  const [notes,    setNotes]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  const name  = profileName || 'Customer';
  const phone = user?.phoneNumber ?? '';

  const ready = brand.trim() && model.trim() && line1.trim() && city.trim() && pincode.length === 6;

  async function submit() {
    if (!user) { setAuthOpen(true); return; }
    if (!ready) return;
    setError(''); setBusy(true);
    try {
      await addDoc(collection(db, 'subscriptions'), {
        plan:          planId,
        cycle,
        price,
        status:        'pending',
        customerId:    user.uid,
        customerName:  name,
        customerPhone: phone,
        vehicle: { make: brand, model, registration: plate },
        address: { line1, city, pincode },
        preferredDay:  day,
        preferredSlot: slot,
        notes:         notes.trim(),
        createdAt:     serverTimestamp(),
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999, margin: '0 auto 28px',
          background: 'var(--pc-sage-subtle)', border: '1px solid var(--pc-sage-hi)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--pc-sage-hi)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <Eyebrow style={{ display: 'block', marginBottom: 12 }}>[SUBSCRIPTION] / CONFIRMED</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px,5vw,40px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          You&apos;re all set.
        </h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 32px' }}>
          Your <strong style={{ color: 'var(--pc-fg)' }}>{plan.name} {CYCLE_FULL[cycle]}</strong> subscription is being set up.
          Our team will call you within 24 hours to confirm your first visit and recurring schedule.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            padding: '13px 32px', borderRadius: 999,
            background: 'var(--pc-warm)', color: 'var(--pc-ink)',
            border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13,
            fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <>
      <AuthBottomSheet
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        heading="Sign in to complete your subscription."
        onSuccess={() => { setAuthOpen(false); submit(); }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px,5vw,64px) 20px clamp(48px,8vw,96px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Eyebrow style={{ display: 'block', marginBottom: 10 }}>
            [SUBSCRIPTION] / {plan.name.toUpperCase()} · {CYCLE_FULL[cycle].toUpperCase()}
          </Eyebrow>
          <h1 style={{
            fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px,5vw,48px)',
            fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em',
            margin: '0 0 10px', lineHeight: 1.05,
          }}>
            Set up your subscription.
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.6 }}>
            Tell us about your car and when works best. We&apos;ll call to confirm your first visit.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,320px)', gap: 32, alignItems: 'start' }}>

          {/* ── Left: form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Vehicle */}
            <Card style={{ padding: 24 }}>
              <Eyebrow style={{ display: 'block', marginBottom: 20 }}>YOUR VEHICLE</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Label>Make</Label>
                  <select value={brand} onChange={e => setBrand(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
                    <option value="">Select make</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
                  <div>
                    <Label>Model</Label>
                    <input placeholder="e.g. Creta, Nexon" value={model} onChange={e => setModel(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <Label>Number plate (optional)</Label>
                    <input placeholder="DL 01 AB 1234" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} style={{ ...inp, fontFamily: 'var(--pc-mono)' }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Address */}
            <Card style={{ padding: 24 }}>
              <Eyebrow style={{ display: 'block', marginBottom: 20 }}>SERVICE ADDRESS</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Label>Flat / house no. &amp; street</Label>
                  <input placeholder="B-204, Kavi Nagar" value={line1} onChange={e => setLine1(e.target.value)} style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12 }}>
                  <div>
                    <Label>City</Label>
                    <input placeholder="Ghaziabad" value={city} onChange={e => setCity(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <input placeholder="201001" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" style={inp} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Schedule preference */}
            <Card style={{ padding: 24 }}>
              <Eyebrow style={{ display: 'block', marginBottom: 20 }}>PREFERRED SCHEDULE</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <Label>Preferred day</Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {DAYS.map(d => (
                      <button key={d} type="button" onClick={() => setDay(d)} style={{
                        padding: '7px 14px', borderRadius: 999,
                        border: `1px solid ${day === d ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                        background: day === d ? 'var(--pc-sage-subtle)' : 'transparent',
                        color: day === d ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg-2)',
                        fontFamily: 'var(--pc-sans)', fontSize: 13,
                        fontWeight: day === d ? 600 : 400,
                        cursor: 'pointer',
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Preferred time slot</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SLOTS.map(s => (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="radio" name="slot" value={s} checked={slot === s} onChange={() => setSlot(s)} />
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Gate code, parking instructions, special requests…"
                    rows={3}
                    style={{ ...inp, resize: 'vertical' }}
                  />
                </div>
              </div>
            </Card>

            {error && (
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>{error}</p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={busy || !ready}
              style={{
                padding: '15px 0', borderRadius: 999,
                background: busy || !ready ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
                color: 'var(--pc-ink)', border: 'none',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: busy || !ready ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Confirming…' : 'Confirm Subscription →'}
            </button>
          </div>

          {/* ── Right: plan summary ── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <Card style={{ padding: 24 }}>
              <Eyebrow style={{ display: 'block', marginBottom: 16 }}>YOUR PLAN</Eyebrow>
              <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {plan.name}
              </div>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: '0.1em', marginBottom: 20 }}>
                {CYCLE_FULL[cycle].toUpperCase()}
              </div>

              <div style={{ borderTop: '1px solid var(--pc-line)', paddingTop: 16, marginBottom: 20 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pc-sage-hi)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--pc-line)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Total</span>
                <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 26, color: 'var(--pc-fg)', letterSpacing: '-0.02em' }}>
                  ₹{price.toLocaleString('en-IN')}
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginLeft: 4 }}>
                    /{CYCLE_LABEL[cycle]}
                  </span>
                </span>
              </div>

              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', marginTop: 12, lineHeight: 1.6 }}>
                No setup fee. Cancel anytime with 30 days&apos; notice. Our team will call to confirm your first visit.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
