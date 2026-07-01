'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, getDocs,
  serverTimestamp, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CustomerSocietyRecord, CleaningLog, Society } from '@pc/firebase';
import Link from 'next/link';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function parseScheduleDays(schedule: string): number[] {
  const daysPart = schedule.split('·')[0] ?? '';
  return daysPart
    .split(',')
    .map(d => DAY_MAP[d.trim()])
    .filter((n): n is number => n !== undefined);
}

function getUpcomingDates(dayIndices: number[], n: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow
  while (dates.length < n) {
    if (dayIndices.includes(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(hour: number) {
  if (hour === 0 || hour === 12) return hour === 0 ? '12:00 AM' : '12:00 PM';
  return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
}

function toDate(v: any): Date {
  if (!v) return new Date();
  return typeof v.toDate === 'function' ? v.toDate() : new Date(v);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const h = i + 7; // 7 through 16
  const label = h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  return { label, value: h };
});

const ACCOUNT_TABS = [
  { label: 'Schedule', href: '/account/cleaning' },
  { label: 'Bookings', href: '/account'          },
  { label: 'Profile',  href: '/account/profile'  },
  { label: 'Bill',     href: '/account/wallet'   },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 14px',
};

const metaLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--pc-fg-4)', margin: 0,
};

// ─── Self-signup form ─────────────────────────────────────────────────────────

type LiveSociety = Society & { id: string };

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 14px',
  background: 'var(--pc-ink-raised)',
  border: '1px solid var(--pc-line)',
  borderRadius: 8,
  fontFamily: 'var(--pc-sans)', fontSize: 13,
  color: 'var(--pc-fg)', outline: 'none',
};

function SelfSignupForm({
  userId,
  userPhone,
  userName,
}: {
  userId: string;
  userPhone: string | null;
  userName: string | null;
}) {
  const [societies, setSocieties] = useState<LiveSociety[]>([]);
  const [name, setName] = useState(userName ?? '');
  const [societyId, setSocietyId] = useState('');
  const [tower, setTower] = useState('');
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [preferredTime, setPreferredTime] = useState(9);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'societies'), where('isActive', '==', true)))
      .then(snap => setSocieties(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSociety))))
      .catch(() => {});
  }, []);

  const selectedSociety = societies.find(s => s.id === societyId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !societyId || !tower || !plate.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(''); setSubmitting(true);
    try {
      const carPlate = plate.trim().toUpperCase();
      const societyName = selectedSociety?.name ?? '';

      await addDoc(collection(db, 'pendingApprovals'), {
        societyId, societyName, tower,
        customerId:            userId,
        customerName:          name.trim(),
        customerPhone:         userPhone ?? '',
        carPlate, carMake: make.trim(), carModel: model.trim(),
        preferredCleaningTime: preferredTime,
        status:                'pending',
        submittedAt:           serverTimestamp(),
      });

      await addDoc(collection(db, 'customerSocietyRecords'), {
        customerId:            userId,
        societyId, societyName, tower,
        cars: [{ plate: carPlate, make: make.trim(), model: model.trim() }],
        preferredCleaningTime: preferredTime,
        signupSource:          'self_signup',
        status:                'pending',
        monthlyFee:            0,
        nextBillingDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus:         'not_verified',
        skipDates:             [],
        rescheduledSlots:      [],
        createdAt:             serverTimestamp(),
        updatedAt:             serverTimestamp(),
      });
      // The onSnapshot listener on this page will detect the new record and switch to the pending UI.
    } catch (err: unknown) {
      setError('Something went wrong. Please try again.');
      console.error('[SelfSignup]', err);
      setSubmitting(false);
    }
  }

  const fieldLabel: React.CSSProperties = {
    fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--pc-fg-4)', display: 'block', marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-6)' }}>
      <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

        {/* Your name */}
        <div>
          <label style={fieldLabel}>Your name *</label>
          <input
            type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder="Full name" style={inputStyle}
          />
        </div>

        {/* Society + tower */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={fieldLabel}>Society *</label>
            <select
              required value={societyId}
              onChange={e => { setSocietyId(e.target.value); setTower(''); }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select society…</option>
              {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Tower *</label>
            <select
              required value={tower}
              onChange={e => setTower(e.target.value)}
              disabled={!selectedSociety}
              style={{ ...inputStyle, cursor: selectedSociety ? 'pointer' : 'not-allowed', opacity: selectedSociety ? 1 : 0.5 }}
            >
              <option value="">Select tower…</option>
              {(selectedSociety?.towers ?? []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Car details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          <div>
            <label style={fieldLabel}>Car plate *</label>
            <input
              type="text" required value={plate} onChange={e => setPlate(e.target.value)}
              placeholder="DL 01 AB 1234" style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>Make</label>
            <input
              type="text" value={make} onChange={e => setMake(e.target.value)}
              placeholder="Maruti, Honda…" style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>Model</label>
            <input
              type="text" value={model} onChange={e => setModel(e.target.value)}
              placeholder="Swift, City…" style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Time preference */}
      <div>
        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 14px' }}>PREFERRED CLEANING TIME</p>
        <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-5)' }}>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', margin: '0 0 14px' }}>Select your preferred slot</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {TIME_OPTIONS.map(opt => {
              const selected = preferredTime === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setPreferredTime(opt.value)} style={{
                  padding: '10px 0', borderRadius: 8, textAlign: 'center',
                  background: selected ? 'var(--pc-sage)' : 'var(--pc-ink-raised)',
                  border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                  fontFamily: 'var(--pc-sans)', fontSize: 13,
                  color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit" disabled={submitting}
        style={{
          padding: '14px 28px', borderRadius: 999,
          background: submitting ? 'var(--pc-card-hi)' : 'var(--pc-warm)',
          border: 'none', color: 'var(--pc-ink)',
          fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          transition: 'background 0.15s ease, opacity 0.15s ease',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Submitting…' : 'Request Enrolment'}
      </button>
    </form>
  );
}

// ─── Time preference section ──────────────────────────────────────────────────

function TimePreferenceSection({
  activeTime,
  saving,
  onSelect,
  locked = false,
}: {
  activeTime: number;
  saving: boolean;
  onSelect: (h: number) => void;
  locked?: boolean;
}) {
  return (
    <section>
      <p style={sectionLabel}>PREFERRED CLEANING TIME</p>
      <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-5)' }}>
        {locked && (
          <div style={{ marginBottom: 'var(--pc-space-4)', padding: 'var(--pc-space-3) var(--pc-space-4)', background: 'color-mix(in srgb, var(--pc-warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--pc-warning) 25%, transparent)', borderRadius: 'var(--pc-radius-sm)' }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-warning)', margin: 0, lineHeight: 1.5 }}>
              Your preference is saved and will take effect once your enrolment is approved.
            </p>
          </div>
        )}
        <p style={{ ...metaLabel, marginBottom: 14 }}>Select your preferred slot</p>
        {/* 5-col grid — wraps to fewer cols on narrow screens */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {TIME_OPTIONS.map(opt => {
            const selected = activeTime === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={saving || locked}
                onClick={() => onSelect(opt.value)}
                style={{
                  padding: '10px 0', borderRadius: 8, textAlign: 'center',
                  background: selected ? 'var(--pc-sage)' : 'var(--pc-ink-raised)',
                  border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                  fontFamily: 'var(--pc-sans)', fontSize: 13,
                  color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)',
                  cursor: saving || locked ? 'default' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: '14px 0 0', lineHeight: 1.5 }}>
          Workers will arrive at this time on your scheduled cleaning days. Changes apply from the next session.
        </p>
      </div>
    </section>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ pathname }: { pathname: string }) {
  return (
    <div style={{
      display: 'flex', gap: 'var(--pc-space-1)',
      borderBottom: '1px solid var(--pc-line)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {ACCOUNT_TABS.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} style={{
            padding: 'var(--pc-space-3) var(--pc-space-4)',
            fontFamily: 'var(--pc-sans)', fontSize: 13,
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
            textDecoration: 'none',
            borderBottom: active ? '2px solid var(--pc-fg)' : '2px solid transparent',
            marginBottom: -1, whiteSpace: 'nowrap',
            transition: 'color 0.15s ease',
          }}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CleaningPage() {
  const { user, loading } = useCustomerAuth();
  const router   = useRouter();
  const pathname = usePathname();

  type RecordState = (CustomerSocietyRecord & { id: string }) | null | 'loading';
  const [record,   setRecord]   = useState<RecordState>('loading');
  const [schedule, setSchedule] = useState('');
  const [logs,     setLogs]     = useState<(CleaningLog & { id: string })[]>([]);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/signin?from=/account/cleaning');
  }, [user, loading, router]);

  // Live society record
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'customerSocietyRecords'),
      where('customerId', '==', user.uid),
    );
    return onSnapshot(
      q,
      snap => {
        if (snap.empty) { setRecord(null); return; }
        const d    = snap.docs[0];
        const data = d.data();
        const rec: CustomerSocietyRecord & { id: string } = {
          ...(data as any),
          id: d.id,
          skipDates:        (data.skipDates ?? []).map(toDate),
          rescheduledSlots: (data.rescheduledSlots ?? []).map((s: any) => ({
            ...s, date: toDate(s.date),
          })),
          createdAt:       toDate(data.createdAt),
          updatedAt:       toDate(data.updatedAt),
          nextBillingDate: toDate(data.nextBillingDate),
          lastBilledDate:  data.lastBilledDate ? toDate(data.lastBilledDate) : undefined,
        };
        setRecord(rec);
        getDoc(doc(db, 'societies', rec.societyId)).then(s => {
          if (s.exists()) setSchedule(s.data().cleaningSchedule ?? '');
        });
      },
      // On error (e.g. permission denied) treat as not enrolled so the page isn't blank
      () => setRecord(null),
    );
  }, [user?.uid]);

  // Recent cleaning logs (last 5)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'cleaningLogs'),
      where('customerId', '==', user.uid),
      orderBy('cleanedAt', 'desc'),
      limit(5),
    );
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({
        ...(d.data() as any),
        id:        d.id,
        cleanedAt: toDate(d.data().cleanedAt),
      })));
    });
  }, [user?.uid]);

  async function toggleSkip(date: Date) {
    if (!record || record === 'loading') return;
    setSaving(true);
    const alreadySkipped = record.skipDates.some(d => isSameDay(d, date));
    await updateDoc(doc(db, 'customerSocietyRecords', record.id), {
      skipDates:  alreadySkipped
        ? record.skipDates.filter(d => !isSameDay(d, date))
        : [...record.skipDates, date],
      updatedAt:  serverTimestamp(),
    });
    setSaving(false);
  }

  async function savePermanentTime(hour: number) {
    if (!record || record === 'loading') return;
    setSaving(true);
    await updateDoc(doc(db, 'customerSocietyRecords', record.id), {
      permanentTime: hour,
      updatedAt:     serverTimestamp(),
    });
    setSaving(false);
  }

  if (loading || record === 'loading') return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
    </div>
  );
  if (!user) return null;

  const dayIndices    = schedule ? parseScheduleDays(schedule) : [];
  const upcomingDates = dayIndices.length > 0 ? getUpcomingDates(dayIndices, 6) : [];
  const activeTime    = record
    ? (record.permanentTime ?? record.preferredCleaningTime ?? 9)
    : 9;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{
        flex: 1, maxWidth: 800, width: '100%', margin: '0 auto',
        padding: 'var(--pc-space-12) var(--pc-space-6) var(--pc-space-20)',
        display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)',
      }}>

        {/* Page header */}
        <div>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 10px' }}>
            [ACCOUNT]
          </p>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>
            My cleaning schedule.
          </h1>
        </div>

        <TabBar pathname={pathname} />

        {/* ── Not enrolled ──────────────────────────────────────────────────── */}
        {record === null && (
          <>
            <div>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', margin: '0 0 8px' }}>[NOT ENROLLED]</p>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 26, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                Join the society programme.
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', lineHeight: 1.6, margin: 0 }}>
                Your car gets cleaned every week — no booking, no chasing. Fill in your details and we'll call to confirm.
              </p>
            </div>
            {user && (
              <SelfSignupForm
                userId={user.uid}
                userPhone={user.phoneNumber}
                userName={user.displayName}
              />
            )}
          </>
        )}

        {/* ── Pending approval ──────────────────────────────────────────────── */}
        {record && record.status === 'pending' && (
          <>
            <div style={{ background: 'color-mix(in srgb, var(--pc-warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--pc-warning) 30%, transparent)', borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-6)' }}>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-warning)', margin: '0 0 8px' }}>
                [PENDING APPROVAL]
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 6px' }}>
                Your registration is under review.
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', lineHeight: 1.6, margin: 0 }}>
                We'll call you to verify your details and confirm your slot. You'll receive an SMS once approved — usually within 24 hours.
              </p>
            </div>

            {/* Time preference — editable even before approval */}
            <TimePreferenceSection
              activeTime={activeTime}
              saving={saving}
              onSelect={savePermanentTime}
              locked={false}
            />

            {/* Still show the summary of what was submitted */}
            <section>
              <p style={sectionLabel}>SUBMITTED DETAILS</p>
              <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-4)' }}>
                  {[
                    { label: 'Society',  val: record.societyName },
                    { label: 'Tower',    val: record.tower       },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p style={metaLabel}>{label}</p>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '4px 0 0' }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 'var(--pc-space-3)', borderTop: '1px solid var(--pc-line)' }}>
                  <p style={metaLabel}>Registered cars</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {record.cars.map((car, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg)', background: 'var(--pc-ink-raised)', border: '1px solid var(--pc-line-strong)', padding: '3px 10px', borderRadius: 6, letterSpacing: '0.06em' }}>
                          {car.plate}
                        </span>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                          {car.make} {car.model}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Active enrolment ──────────────────────────────────────────────── */}
        {record && record.status === 'active' && (
          <>
            {/* Enrolment summary card */}
            <section>
              <p style={sectionLabel}>YOUR PROGRAMME</p>
              <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>
                      {record.societyName}
                    </p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
                      {record.tower}
                    </p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, background: 'color-mix(in srgb, var(--pc-sage) 15%, transparent)', border: '1px solid rgba(74,94,68,0.3)', fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-sage-hi)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    ACTIVE
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--pc-space-4)', paddingTop: 'var(--pc-space-3)', borderTop: '1px solid var(--pc-line)' }}>
                  {[
                    { label: 'Cleaning days', val: schedule.split('·')[0]?.trim() || '—' },
                    { label: 'Your slot',     val: formatTime(activeTime) },
                    { label: 'Monthly fee',   val: `₹${record.monthlyFee.toLocaleString('en-IN')}` },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p style={metaLabel}>{label}</p>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: '4px 0 0', fontWeight: 500 }}>{val}</p>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: 'var(--pc-space-3)', borderTop: '1px solid var(--pc-line)' }}>
                  <p style={{ ...metaLabel, marginBottom: 10 }}>Registered cars</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {record.cars.map((car, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg)', background: 'var(--pc-ink-raised)', border: '1px solid var(--pc-line-strong)', padding: '4px 10px', borderRadius: 6, letterSpacing: '0.06em' }}>
                          {car.plate}
                        </span>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                          {car.make} {car.model}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Upcoming sessions */}
            {upcomingDates.length > 0 && (
              <section>
                <p style={sectionLabel}>UPCOMING CLEANINGS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingDates.map((date, i) => {
                    const isSkipped = record.skipDates.some(d => isSameDay(d, date));
                    return (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 'var(--pc-space-4) var(--pc-space-5)',
                        background: isSkipped ? 'var(--pc-ink-raised)' : 'var(--pc-card)',
                        border: `1px solid ${isSkipped ? 'var(--pc-line-faint)' : 'var(--pc-line)'}`,
                        borderRadius: 'var(--pc-radius-sm)',
                        opacity: isSkipped ? 0.65 : 1,
                        transition: 'opacity 0.15s ease, background 0.15s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: isSkipped ? 'var(--pc-fg-4)' : 'var(--pc-fg)', textDecoration: isSkipped ? 'line-through' : 'none' }}>
                            {formatDateShort(date)}
                          </span>
                          <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)' }}>
                            {formatTime(activeTime)}
                          </span>
                          {isSkipped && (
                            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--pc-fg-4)', textTransform: 'uppercase' }}>
                              Skipped
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => toggleSkip(date)}
                          style={{
                            padding: '5px 14px', borderRadius: 999,
                            border: '1px solid currentColor', background: 'transparent',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--pc-sans)', fontSize: 12,
                            color: isSkipped ? 'var(--pc-sage-hi)' : 'var(--pc-fg-3)',
                            opacity: saving ? 0.5 : 1,
                            transition: 'color 0.15s ease',
                          }}
                        >
                          {isSkipped ? 'Undo skip' : 'Skip'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Cleaning time preference */}
            <TimePreferenceSection
              activeTime={activeTime}
              saving={saving}
              onSelect={savePermanentTime}
            />
          </>
        )}

        {/* ── Cleaning history (shown for active + pending if there are logs) ── */}
        {logs.length > 0 && (
          <section>
            <p style={sectionLabel}>RECENT CLEANINGS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--pc-space-4) var(--pc-space-5)',
                  background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                  borderRadius: 'var(--pc-radius-sm)',
                }}>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: 0 }}>
                      {formatDateShort(log.cleanedAt)}
                    </p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: '3px 0 0' }}>
                      {log.vehicleRegistration} · cleaned by {log.workerName}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: 0, fontWeight: 500 }}>
                      ₹{log.servicePrice.toLocaleString('en-IN')}
                    </p>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {log.serviceType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
