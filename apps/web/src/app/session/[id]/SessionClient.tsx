'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@pc/firebase';

export interface SessionCar {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  unitNumber: string;
  parkingNumber: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number | null;
  status: string; // 'pending' | 'in_progress' | 'done' | 'skipped'
}

export interface SessionData {
  id: string;
  societyName: string;
  sessionType: 'wash' | 'deep-clean';
  tower: string | null;
  workerName: string;
  scheduledDate: string | null;
  status: string;
  totalCars: number;
  completedCars: number;
  startedAt: string | null;
  completedAt: string | null;
  cars: SessionCar[];
}

interface Props {
  initialSession: SessionData;
  sessionId: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// Minutes from now until the car's scheduled hour, today. Negative means
// the slot has already passed (still not done) — treated as most urgent.
function minutesUntilScheduled(hour: number | null): number | null {
  if (hour == null) return null;
  const scheduled = new Date();
  scheduled.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
  return Math.round((scheduled.getTime() - Date.now()) / 60_000);
}

// Due-status label + colour for a car's scheduled slot — red once the slot
// has passed (still not done), blue inside the hour leading up to it,
// muted grey otherwise. Mirrors the red/blue "Yesterday"/"Today" convention
// list apps use for due dates.
function scheduleStatus(hour: number | null): { label: string; color: string } | null {
  if (hour == null) return null;
  const mins = minutesUntilScheduled(hour);
  if (mins == null) return null;
  const time = formatPreferredTime(hour);
  if (mins <= 0) return { label: `Overdue · ${time}`, color: 'var(--pc-danger)' };
  if (mins <= 60) return { label: `Due soon · ${time}`, color: 'var(--pc-info)' };
  return { label: time, color: 'var(--pc-fg-3)' };
}

// Not-available (skipped) cars sink to the bottom; done cars sit above them
// but below the active work; active cars are ordered by urgency so the
// worker always sees what's due soonest at the top.
function sortForWorker(cars: SessionCar[]): SessionCar[] {
  const group = (c: SessionCar) => c.status === 'skipped' ? 2 : c.status === 'done' ? 1 : 0;
  return [...cars].sort((a, b) => {
    const ga = group(a), gb = group(b);
    if (ga !== gb) return ga - gb;
    if (ga === 0) {
      const ma = minutesUntilScheduled(a.preferredTime) ?? Infinity;
      const mb = minutesUntilScheduled(b.preferredTime) ?? Infinity;
      return ma - mb;
    }
    return (a.unitNumber || '').localeCompare(b.unitNumber || '', 'en', { numeric: true });
  });
}

// Minimal inline SVG monogram so this page has no external deps
function PCMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="6" fill="var(--pc-sage)" />
      <text x="14" y="20" textAnchor="middle" fontFamily="var(--pc-serif, Georgia, serif)" fontSize="14" fill="var(--pc-sage-ink)" letterSpacing="-1">PC</text>
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

// Rotating ChevronLeft covers both directions rather than shipping a second SVG.
function ChevronDown({ open }: { open: boolean }) {
  return (
    <span style={{ display: 'inline-flex', transform: `rotate(${open ? 90 : -90}deg)`, transition: 'transform 0.15s ease' }}>
      <ChevronLeft />
    </span>
  );
}

// Marks a car's due time as recurring (this session repeats weekly) —
// same visual cue a "Yesterday / Today / Tomorrow" list app uses next to
// a repeating task's due date.
function RepeatIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function formatPreferredTime(hour: number | null): string {
  if (hour == null) return '—';
  const h24 = Math.floor(hour);
  const minutes = Math.round((hour % 1) * 60);
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
}

const POLL_INITIAL_MS = 5_000;
const POLL_MAX_MS     = 60_000;

export default function SessionClient({ initialSession, sessionId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData>(initialSession);
  const [actingId, setActingId] = useState<string | null>(null); // customerId currently being marked, or 'complete'
  const [error,   setError]   = useState('');
  // The car list carries resident PII, so the API refuses to return it without
  // a valid worker/admin token — this tracks that case separately from a
  // generic fetch failure so we can show a clear "sign in" prompt instead of
  // silently rendering an empty list.
  const [authError, setAuthError] = useState(false);
  const [loaded,    setLoaded]    = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(POLL_INITIAL_MS);
  // setTimeout below re-arms the next poll by calling back through this ref
  // rather than closing over `poll` directly — referencing the in-progress
  // `const poll = ...` from inside its own initializer is what the compiler
  // flags (react-hooks/immutability), even though it's safe at runtime.
  const pollRef = useRef<() => Promise<void>>(async () => {});

  const poll = useCallback(async () => {
    try {
      // auth.currentUser is synchronously null for a moment after page load
      // even when the visitor is genuinely signed in — wait for the first
      // resolution before deciding there's no token to send.
      await auth.authStateReady();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('UNAUTHENTICATED');

      const res  = await fetch(`/api/session/${sessionId}`, {
        cache:   'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) throw new Error('UNAUTHENTICATED');
      if (!res.ok) throw new Error('non-ok');
      const data = await res.json();
      setSession(s => ({ ...s, ...data }));
      setAuthError(false);
      setLoaded(true);
      intervalRef.current = POLL_INITIAL_MS;        // reset to fast on success
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHENTICATED') setAuthError(true);
      intervalRef.current = Math.min(intervalRef.current * 2, POLL_MAX_MS); // backoff
    }
    timerRef.current = setTimeout(() => pollRef.current(), intervalRef.current);
  }, [sessionId]);

  // Keeps pollRef current without assigning to a ref during render.
  useEffect(() => { pollRef.current = poll; }, [poll]);

  // Fetch immediately on mount (the car list starts empty — see page.tsx),
  // then keep polling; clean up on unmount. Kicking off through a 0ms
  // setTimeout (rather than calling poll() directly) keeps the state
  // updates inside a callback instead of the effect body itself.
  useEffect(() => {
    timerRef.current = setTimeout(() => pollRef.current(), 0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [poll]);

  async function sendAction(action: 'clean_car' | 'complete', customerId?: string) {
    setActingId(customerId ?? 'complete');
    setError('');
    try {
      // auth.currentUser is synchronously null for a moment after page load
      // even when the visitor is genuinely signed in — Firebase restores the
      // persisted session asynchronously. authStateReady() waits for that
      // first resolution so a fast click right after load doesn't get
      // mistaken for "not signed in".
      await auth.authStateReady();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('You need to be signed in as the assigned worker to do this.');
      const res  = await fetch(`/api/session/${sessionId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ action, customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed.');

      if (action === 'clean_car' && customerId) {
        setSession(s => ({
          ...s,
          completedCars: data.completedCars,
          totalCars:     data.totalCars,
          status:        data.status,
          cars: s.cars.map(c => c.customerId === customerId ? { ...c, status: 'done' } : c),
        }));
      } else {
        setSession(s => ({ ...s, ...data }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  // Dashboard/calendar cards link here with an explicit ?from= so back always
  // lands exactly where the worker came from. document.referrer looked like
  // it could tell in-app navigation apart from a direct/bookmarked open, but
  // it's set once at the tab's initial page load and never updates for
  // client-side (App Router) navigations — so it doesn't actually reflect
  // "did I just click through from the previous screen".
  function handleBack() {
    const from = new URLSearchParams(window.location.search).get('from');
    router.push(from && from.startsWith('/worker/') ? from : '/worker/dashboard');
  }

  const { totalCars, completedCars, status, workerName, societyName, sessionType, tower, scheduledDate, cars } = session;
  const pct = totalCars > 0 ? (completedCars / totalCars) : 0;
  const allDone = completedCars >= totalCars;

  // ── SVG circle progress ───────────────────────────────────────────────────
  const R   = 60;
  const CIR = 2 * Math.PI * R;
  const offset = CIR * (1 - pct);

  // Semantic status colours only — sage/gold are never used as CTA fills
  // (design system rule), and gold is reserved for the wordmark hairline,
  // never a status colour either. Mirrors the worker dashboard's
  // done=success, active=sage convention.
  const statusColor =
    status === 'done'       ? 'var(--pc-success)' :
    status === 'inprogress' ? 'var(--pc-sage)' :
    'var(--pc-fg-4)';

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--pc-ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 20px 40px',
      boxSizing: 'border-box',
      fontFamily: 'var(--pc-sans)',
    }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 480, paddingTop: 40, paddingBottom: 8 }}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, marginLeft: -12, marginBottom: 8,
            background: 'none', border: 'none', color: 'var(--pc-fg-3)', cursor: 'pointer',
          }}
        >
          <ChevronLeft />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <PCMark />
          <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 15, color: 'var(--pc-fg)', letterSpacing: '0.02em' }}>Perfect Cleaners</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            CLEANING SESSION
          </p>
          <span style={{
            fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.06em',
            color: 'var(--pc-info)', background: 'color-mix(in srgb, var(--pc-info) 15%, transparent)',
            padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase',
          }}>
            {sessionType === 'deep-clean' ? 'Deep clean' : 'Wash'}
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 24, fontWeight: 400, color: 'var(--pc-fg)', margin: 0, letterSpacing: '-0.02em' }}>
          {tower ? `${tower} · ${societyName}` : societyName}
        </h1>
        {scheduledDate && (
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
            {formatDate(scheduledDate)}
          </p>
        )}
      </div>

      {/* Progress summary */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0' }}>
        <div style={{ position: 'relative', width: R * 2 + 14, height: R * 2 + 14, flexShrink: 0 }}>
          <svg width={R * 2 + 14} height={R * 2 + 14} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track — stroke/fill attributes don't resolve CSS vars, so the colour
                must go through the style prop, not a raw stroke="var(...)" attribute. */}
            <circle cx={R + 7} cy={R + 7} r={R} fill="none" style={{ stroke: 'var(--pc-line)' }} strokeWidth={8} />
            <circle
              cx={R + 7} cy={R + 7} r={R}
              fill="none"
              style={{ stroke: statusColor, transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={CIR}
              strokeDashoffset={offset}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', lineHeight: 1 }}>
              {completedCars}
            </span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', marginTop: 2 }}>
              of {totalCars}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content',
            padding: '5px 14px', borderRadius: 999,
            background: status === 'done' ? 'color-mix(in srgb, var(--pc-success) 20%, transparent)' : status === 'inprogress' ? 'color-mix(in srgb, var(--pc-sage) 15%, transparent)' : 'var(--pc-card)',
            border: `1px solid ${statusColor}`,
          }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {status === 'scheduled' ? 'Not started' : status === 'inprogress' ? 'In progress' : 'Done'}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {status === 'done' ? 'Session complete' : 'Tap a car below to mark it clean'}
          </p>
        </div>
      </div>

      {error && (
        <p style={{ width: '100%', maxWidth: 480, fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)', margin: '0 0 12px' }}>{error}</p>
      )}

      {/* Car checklist — this is the actual work list; the ring above is just a summary.
          Sorted by urgency (soonest scheduled time first); done cars sink below the
          active work, and not-available (skipped) cars sink to the very bottom. */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortForWorker(cars).map(car => {
          const done    = car.status === 'done';
          const skipped = car.status === 'skipped';
          const acting  = actingId === car.customerId;
          const due     = !done && !skipped ? scheduleStatus(car.preferredTime) : null;
          const parkingLabel = car.parkingNumber ? `Parking ${car.parkingNumber}` : '';
          const expanded = expandedId === car.customerId;
          return (
            <div
              key={car.customerId}
              style={{
                background: 'var(--pc-card)',
                border: '1px solid var(--pc-line)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', boxSizing: 'border-box' }}>
                {/* Checkbox — the primary action; tap to mark this car clean */}
                <button
                  type="button"
                  disabled={done || skipped || acting}
                  onClick={() => sendAction('clean_car', car.customerId)}
                  aria-label={done ? 'Cleaned' : 'Mark clean'}
                  style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                    border: `1.5px solid ${done ? 'var(--pc-sage-hi)' : skipped ? 'var(--pc-line)' : 'var(--pc-line-strong)'}`,
                    background: done ? 'var(--pc-sage-hi)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: done || skipped ? 'default' : 'pointer',
                    opacity: acting ? 0.5 : 1,
                  }}
                >
                  {done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--pc-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(expanded ? null : car.customerId)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expanded ? null : car.customerId); } }}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer', opacity: done || skipped ? 0.55 : 1 }}
                >
                  <p style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px',
                    textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'var(--pc-fg-3)',
                  }}>
                    {car.unitNumber ? `Flat ${car.unitNumber} · ` : ''}{car.customerName || 'Resident'}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.03em' }}>
                    {car.carPlate}{(car.carMake || car.carModel) && ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}`}
                    {parkingLabel && ` · ${parkingLabel}`}
                  </p>
                  {skipped ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4,
                      fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)',
                    }}>
                      Not available today
                    </span>
                  ) : due ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4,
                      fontFamily: 'var(--pc-sans)', fontSize: 11.5, fontWeight: 600, color: due.color,
                    }}>
                      <RepeatIcon color={due.color} />
                      {due.label}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : car.customerId)}
                  aria-label={expanded ? 'Hide details' : 'Show details'}
                  style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--pc-fg-4)', cursor: 'pointer', padding: 4 }}
                >
                  <ChevronDown open={expanded} />
                </button>
              </div>

              {expanded && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 1, background: 'var(--pc-line)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</span>
                      {car.customerPhone ? (
                        <a href={`tel:${car.customerPhone}`} onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-info)', textDecoration: 'none' }}>
                          {car.customerPhone}
                        </a>
                      ) : (
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>—</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit</span>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{car.unitNumber || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parking</span>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{car.parkingNumber || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vehicle</span>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', textAlign: 'right' }}>
                        {car.carPlate}{(car.carMake || car.carModel) && ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preferred time</span>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{formatPreferredTime(car.preferredTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {cars.length === 0 && authError && (
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', textAlign: 'center', padding: '24px 0' }}>
            Sign in as the assigned worker to view this session.
          </p>
        )}
        {cars.length === 0 && !authError && !loaded && (
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', textAlign: 'center', padding: '24px 0' }}>
            Loading…
          </p>
        )}
        {cars.length === 0 && !authError && loaded && (
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', textAlign: 'center', padding: '24px 0' }}>
            No cars in this session.
          </p>
        )}
      </div>

      {/* Manual override — wraps up the session even if some cars were skipped in person */}
      {status === 'inprogress' && !allDone && (
        <button
          type="button"
          disabled={actingId === 'complete'}
          onClick={() => sendAction('complete')}
          style={{
            width: '100%', maxWidth: 480, marginTop: 16,
            padding: '14px 0', borderRadius: 14, border: '1px solid var(--pc-line-strong)',
            background: 'transparent',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
            color: actingId === 'complete' ? 'var(--pc-fg-4)' : 'var(--pc-fg-2)',
            cursor: actingId === 'complete' ? 'default' : 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          {actingId === 'complete' ? '…' : 'MARK SESSION COMPLETE'}
        </button>
      )}

      {status === 'done' && (
        <div style={{ textAlign: 'center', padding: '20px 0 0' }}>
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-success)', margin: '0 0 4px' }}>Session complete</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
            {completedCars} car{completedCars !== 1 ? 's' : ''} cleaned
          </p>
        </div>
      )}

      {/* Worker label */}
      <p style={{
        fontFamily: 'var(--pc-sans)', fontSize: 12,
        color: 'var(--pc-fg-4)',
        marginTop: 'auto', paddingTop: 32, textAlign: 'center',
      }}>
        Assigned to {workerName || '—'}
      </p>
    </div>
  );
}
