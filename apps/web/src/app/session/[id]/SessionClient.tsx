'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

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
      <text x="14" y="20" textAnchor="middle" fontFamily="Georgia,serif" fontSize="14" fill="#fff" letterSpacing="-1">PC</text>
    </svg>
  );
}

export default function SessionClient({ initialSession, sessionId }: Props) {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [acting,  setActing]  = useState(false);
  const [error,   setError]   = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch(`/api/session/${sessionId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setSession(s => ({ ...s, ...data }));
    } catch { /* best-effort */ }
  }, [sessionId]);

  // Poll every 5 s for live updates (other workers/admin may change the doc)
  useEffect(() => {
    pollRef.current = setInterval(refresh, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh]);

  async function sendAction(action: 'start' | 'increment' | 'complete') {
    setActing(true);
    setError('');
    try {
      const res  = await fetch(`/api/session/${sessionId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed.');
      setSession(s => ({ ...s, ...data }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  const { totalCars, completedCars, status, workerName, societyName, tower, scheduledDate } = session;
  const pct = totalCars > 0 ? (completedCars / totalCars) : 0;
  const allDone = completedCars >= totalCars;

  // ── SVG circle progress ───────────────────────────────────────────────────
  const R   = 72;
  const CIR = 2 * Math.PI * R;
  const offset = CIR * (1 - pct);

  const statusColor =
    status === 'done'       ? 'var(--pc-sage)' :
    status === 'inprogress' ? 'var(--pc-gold)' :
    'rgba(255,255,255,0.35)';

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--pc-ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 20px 40px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans, Inter Tight, sans-serif)',
    }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 440, paddingTop: 48, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <PCMark />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>Perfect Cleaners</span>
        </div>

        <p style={{ fontFamily: 'inherit', fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
          CLEANING SESSION
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 400, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            {tower ? `${tower} · ${societyName}` : societyName}
          </h1>
        </div>
        {scheduledDate && (
          <p style={{ fontFamily: 'inherit', fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            {formatDate(scheduledDate)}
          </p>
        )}
      </div>

      {/* Progress circle */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 28px' }}>
        <div style={{ position: 'relative', width: R * 2 + 20, height: R * 2 + 20 }}>
          <svg width={R * 2 + 20} height={R * 2 + 20} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={R + 10} cy={R + 10} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
            {/* Fill */}
            <circle
              cx={R + 10} cy={R + 10} r={R}
              fill="none"
              stroke={statusColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIR}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
            />
          </svg>
          {/* Center text */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 38, fontWeight: 400, color: '#fff', lineHeight: 1 }}>
              {completedCars}
            </span>
            <span style={{ fontFamily: 'inherit', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              of {totalCars}
            </span>
          </div>
        </div>

        <p style={{ fontFamily: 'inherit', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '12px 0 0' }}>
          {status === 'done' ? 'Session complete' : 'Cars cleaned'}
        </p>
      </div>

      {/* Status badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 14px', borderRadius: 999,
        background: status === 'done' ? 'color-mix(in srgb, var(--pc-sage) 20%, transparent)' : status === 'inprogress' ? 'color-mix(in srgb, var(--pc-gold) 15%, transparent)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${statusColor}`,
        marginBottom: 40,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
        <span style={{ fontFamily: 'inherit', fontSize: 12, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {status === 'scheduled' ? 'Scheduled' : status === 'inprogress' ? 'In progress' : 'Done'}
        </span>
      </div>

      {/* Action area */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && (
          <p style={{ fontFamily: 'inherit', fontSize: 12, color: '#E05252', margin: '0 0 4px', textAlign: 'center' }}>{error}</p>
        )}

        {status === 'scheduled' && (
          <button
            type="button"
            disabled={acting}
            onClick={() => sendAction('start')}
            style={{
              width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
              background: acting ? 'rgba(255,255,255,0.08)' : 'var(--pc-sage)',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
              color: acting ? 'rgba(255,255,255,0.3)' : '#fff',
              cursor: acting ? 'default' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.2s ease',
            }}
          >
            {acting ? 'Starting…' : 'START SESSION'}
          </button>
        )}

        {status === 'inprogress' && (
          <>
            <button
              type="button"
              disabled={acting || allDone}
              onClick={() => sendAction('increment')}
              style={{
                width: '100%', padding: '22px 0', borderRadius: 14, border: 'none',
                background: acting || allDone ? 'rgba(255,255,255,0.06)' : 'color-mix(in srgb, var(--pc-gold) 15%, transparent)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: acting || allDone ? 'rgba(255,255,255,0.1)' : 'var(--pc-gold)',
                fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
                color: acting || allDone ? 'rgba(255,255,255,0.25)' : 'var(--pc-gold)',
                cursor: acting || allDone ? 'default' : 'pointer',
                letterSpacing: '0.04em',
                transition: 'opacity 0.2s ease',
              }}
            >
              {acting ? '…' : allDone ? 'ALL CARS DONE' : '+ CAR CLEANED'}
            </button>

            <button
              type="button"
              disabled={acting}
              onClick={() => sendAction('complete')}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                background: acting ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                color: acting ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
                cursor: acting ? 'default' : 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {acting ? '…' : 'MARK SESSION COMPLETE'}
            </button>
          </>
        )}

        {status === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: 'var(--pc-sage)', margin: '0 0 4px' }}>Session complete</p>
            <p style={{ fontFamily: 'inherit', fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              {completedCars} car{completedCars !== 1 ? 's' : ''} cleaned
            </p>
          </div>
        )}
      </div>

      {/* Worker label */}
      <p style={{
        fontFamily: 'inherit', fontSize: 12,
        color: 'rgba(255,255,255,0.2)',
        marginTop: 'auto', paddingTop: 40, textAlign: 'center',
      }}>
        Assigned to {workerName}
      </p>
    </div>
  );
}
