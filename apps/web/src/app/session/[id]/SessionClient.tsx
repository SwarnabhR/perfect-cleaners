'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { auth } from '@pc/firebase';

export interface SessionCar {
  customerId: string;
  customerName: string;
  unitNumber: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number | null;
  status: string; // 'pending' | 'in_progress' | 'done' | 'skipped'
}

export interface SessionData {
  id: string;
  societyName: string;
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

// Minimal inline SVG monogram so this page has no external deps
function PCMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="6" fill="var(--pc-sage)" />
      <text x="14" y="20" textAnchor="middle" fontFamily="var(--pc-serif, Georgia, serif)" fontSize="14" fill="var(--pc-sage-ink)" letterSpacing="-1">PC</text>
    </svg>
  );
}

const POLL_INITIAL_MS = 5_000;
const POLL_MAX_MS     = 60_000;

export default function SessionClient({ initialSession, sessionId }: Props) {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [actingId, setActingId] = useState<string | null>(null); // customerId currently being marked, or 'complete'
  const [error,   setError]   = useState('');
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(POLL_INITIAL_MS);

  const poll = useCallback(async () => {
    try {
      const res  = await fetch(`/api/session/${sessionId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('non-ok');
      const data = await res.json();
      setSession(s => ({ ...s, ...data }));
      intervalRef.current = POLL_INITIAL_MS;        // reset to fast on success
    } catch {
      intervalRef.current = Math.min(intervalRef.current * 2, POLL_MAX_MS); // backoff
    }
    timerRef.current = setTimeout(poll, intervalRef.current);
  }, [sessionId]);

  // Start polling on mount; clean up on unmount
  useEffect(() => {
    timerRef.current = setTimeout(poll, intervalRef.current);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  const { totalCars, completedCars, status, workerName, societyName, tower, scheduledDate, cars } = session;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <PCMark />
          <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 15, color: 'var(--pc-fg)', letterSpacing: '0.02em' }}>Perfect Cleaners</span>
        </div>

        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
          CLEANING SESSION
        </p>
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

      {/* Car checklist — this is the actual work list; the ring above is just a summary */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cars.map(car => {
          const done   = car.status === 'done';
          const acting = actingId === car.customerId;
          return (
            <div
              key={car.customerId}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 14,
                background: 'var(--pc-card)',
                border: `1px solid ${done ? 'var(--pc-line)' : 'var(--pc-line-strong)'}`,
                opacity: done ? 0.55 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                  {car.unitNumber ? `${car.unitNumber} · ` : ''}{car.customerName || 'Resident'}
                </p>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.03em' }}>
                  {car.carPlate}{(car.carMake || car.carModel) && ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}`}
                </p>
              </div>
              {done ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-success)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
                }}>
                  ✓ Done
                </span>
              ) : (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => sendAction('clean_car', car.customerId)}
                  style={{
                    flexShrink: 0, padding: '10px 16px', borderRadius: 10, border: 'none',
                    background: acting ? 'var(--pc-line)' : 'var(--pc-warm)',
                    fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 700,
                    color: acting ? 'var(--pc-fg-4)' : 'var(--pc-ink)',
                    cursor: acting ? 'default' : 'pointer',
                    letterSpacing: '0.03em', textTransform: 'uppercase',
                  }}
                >
                  {acting ? '…' : 'Mark clean'}
                </button>
              )}
            </div>
          );
        })}

        {cars.length === 0 && (
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
