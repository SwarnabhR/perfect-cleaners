'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { db, resolveTodaysSocieties, resolveWorkerTodoCars, getCarUrgency, buildCarSearchMatcher, isCarActionableNow } from '@pc/firebase';
import type { CleaningLog, CleaningSession, WorkerTodoCar, CarUrgency, CarDueBucket } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import CarSearchInput from '@/components/ui/CarSearchInput';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface LogRow extends CleaningLog { id: string }
interface SessionRow extends CleaningSession { id: string }

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

/**
 * A `now` that actually moves. Every dated thing on this page — which bucket
 * a car falls into, whether it reads "Due soon", which day the recent-cleans
 * log covers — is derived from one Date, and a worker leaves this tab open
 * all day and overnight. Read once at mount, a dashboard opened Monday still
 * shows Monday's buckets on Tuesday morning: today's round never arrives and
 * yesterday's leftovers never drop into MISSED.
 *
 * Deliberately client-side rather than leaning on the nightly
 * cleanup-sessions cron — the rollover a worker sees must not depend on an
 * external scheduler having fired.
 *
 * Ticks every 5 minutes, and immediately when the tab returns to the
 * foreground, which is the case that matters: a phone unlocked the next
 * morning, where background timers have been throttled to nothing.
 */
function useNowTick(intervalMs = 5 * 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const sync = () => setNow(new Date());
    const id = setInterval(sync, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
    };
  }, [intervalMs]);
  return now;
}

function formatTime(ts: Timestamp | Date | null | undefined): string {
  if (!ts) return '—';
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Chip-sized rendering of a stored parking-level label — "Basement 2" → "B2",
// "Ground" → "G". This is the shorthand workers use on the ground ("B1 b2
// ground"), and it has to stay short enough for a row of chips to fit on a
// phone. Unrecognised labels are shown as stored rather than mangled.
function shortLevelLabel(label: string): string {
  const s = label.trim().toLowerCase().replace(/\s+/g, ' ');
  let m = s.match(/^basement ?(\d*)$/);
  if (m) return `B${m[1] || '1'}`;
  if (/^ground( floor)?$/.test(s)) return 'G';
  m = s.match(/^podium ?(\d*)$/);
  if (m) return `P${m[1] || '1'}`;
  m = s.match(/^level ?(\d+)$/);
  if (m) return `L${m[1]}`;
  return label.trim();
}

function formatSlot(hour: number): string {
  const h    = Math.floor(hour);
  const m    = Math.round((hour % 1) * 60);
  const h12  = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Colour/label convention shared with the admin live-cleaning board — red
// overdue, blue due-soon — extended here with the multi-day buckets
// resolveWorkerTodoCars adds on top of getCarUrgency's same-day math.
const URGENCY_COLOR: Record<CarUrgency, string> = {
  overdue: 'var(--pc-danger)', 'due-soon': 'var(--pc-info)', later: 'var(--pc-fg-3)', done: 'var(--pc-fg-3)',
};

function dueLabel(row: WorkerTodoCar, now: Date): { text: string; color: string } {
  const time = formatSlot(row.preferredTime);
  if (row.dueBucket === 'overdue') {
    const dateStr = row.scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return { text: `Overdue · ${dateStr}`, color: URGENCY_COLOR.overdue };
  }
  if (row.dueBucket === 'tomorrow') {
    return { text: `Tomorrow · ${time}`, color: 'var(--pc-fg-4)' };
  }
  if (row.dueBucket === 'later') {
    // Not due yet — getCarUrgency's same-day hour math doesn't apply here
    // since this row's scheduledDate is a future day, not today.
    const dateStr = row.scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return { text: `${dateStr} · ${time}`, color: 'var(--pc-fg-4)' };
  }
  const urgency = getCarUrgency(row.preferredTime, row.status, now);
  if (urgency === 'overdue')  return { text: `Overdue · ${time}`,  color: URGENCY_COLOR.overdue };
  if (urgency === 'due-soon') return { text: `Due soon · ${time}`, color: URGENCY_COLOR['due-soon'] };
  return { text: time, color: 'var(--pc-fg-3)' };
}

// Today first, missed-earlier last. A worker opens this app to do *today's*
// round, and a pile of days-old rows at the top buried it — a real tower had
// 23 overdue rows from three days back sitting above 47 cars due now. Missed
// cars are still listed and still tappable (see the MISSED group at the
// bottom of the checklist); they just no longer outrank the work due today.
const BUCKET_ORDER: Record<CarDueBucket, number> = { today: 0, tomorrow: 1, later: 2, overdue: 3 };
const URGENCY_ORDER: Record<CarUrgency, number> = { overdue: 0, 'due-soon': 1, later: 2, done: 3 };

// Row identity. A flat that owns two vehicles (a car and a two-wheeler)
// produces two rows sharing ONE customerId — the id is per enrolled customer,
// not per vehicle. Keying on customerId alone gave React duplicate keys and
// made "busy" spin both rows at once; the plate is what tells them apart.
function rowKey(r: { sessionId: string; customerId: string; carPlate?: string }): string {
  return `${r.sessionId}::${r.customerId}::${r.carPlate ?? ''}`;
}

/** The same identity as rowKey, for a cleaningLog (its plate field is named
 *  vehicleRegistration), so a to-do row and its resulting log share one
 *  "which vehicle is busy" key. */
function logKey(log: { sessionId?: string; customerId: string; vehicleRegistration?: string }): string {
  return `${log.sessionId ?? ''}::${log.customerId}::${log.vehicleRegistration ?? ''}`;
}

function sortTodoCars(rows: WorkerTodoCar[], now: Date): WorkerTodoCar[] {
  return [...rows].sort((a, b) => {
    if (a.dueBucket !== b.dueBucket) return BUCKET_ORDER[a.dueBucket] - BUCKET_ORDER[b.dueBucket];
    if (a.dueBucket === 'overdue' || a.dueBucket === 'later') {
      const sd = a.scheduledDate.getTime() - b.scheduledDate.getTime();
      if (sd !== 0) return sd;
    }
    if (a.dueBucket === 'today') {
      const ua = getCarUrgency(a.preferredTime, a.status, now);
      const ub = getCarUrgency(b.preferredTime, b.status, now);
      if (ua !== ub) return URGENCY_ORDER[ua] - URGENCY_ORDER[ub];
    }
    return a.preferredTime - b.preferredTime;
  });
}

function CarRow({ row, isFirst, busy, showTowerTag, onToggle, onSetUnavailable, onViewDetails }: {
  row: WorkerTodoCar; isFirst: boolean; busy: boolean; showTowerTag: boolean;
  onToggle: () => void; onSetUnavailable: (unavailable: boolean) => void; onViewDetails: () => void;
}) {
  const due = dueLabel(row, new Date());
  // A future day's car is shown but not completable — see isCarActionableNow.
  const locked = !isCarActionableNow(row.dueBucket);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      borderTop: isFirst ? 'none' : '1px solid var(--pc-line-faint)',
      opacity: row.unavailable ? 0.55 : 1,
    }}>
      {row.unavailable ? (
        // Reported not available. Nothing to tick — the only action left is
        // putting it back, which is what the row's trailing button does.
        <div
          aria-hidden="true"
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            border: '1.5px solid var(--pc-line)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="x" size={11} color="var(--pc-fg-4)" />
        </div>
      ) : locked ? (
        // Deliberately not a button: a future round must not be tickable at
        // all, so there is nothing here to press by accident.
        <div
          title="Scheduled for a later day"
          aria-label="Scheduled for a later day — not yet"
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            border: '1.5px dotted var(--pc-line)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="calendar" size={10} color="var(--pc-fg-4)" />
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          aria-label="Mark clean"
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            border: '1.5px solid var(--pc-line-strong)', background: 'transparent',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>
            Flat {row.unitNumber || '—'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Icon name="clock" size={11} color={due.color} />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, fontWeight: 600, color: due.color, whiteSpace: 'nowrap' }}>
              {due.text}
            </span>
          </div>
        </div>
        {/* Car number always gets its own line — never truncated, since it's
            one of the exact fields a worker needs to identify the car. */}
        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)', margin: '2px 0 0', letterSpacing: '0.02em' }}>
          {row.carPlate || '—'}
          {(row.carMake || row.carModel) && ` · ${[row.carMake, row.carModel].filter(Boolean).join(' ')}`}
          {(row.parkingLevel || row.parkingNumber) && ` · PARKING ${[row.parkingLevel, row.parkingNumber].filter(Boolean).join(' · ')}`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 3 }}>
          {row.customerPhone ? (
            <a
              href={`tel:${row.customerPhone}`}
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-info)', textDecoration: 'none' }}
            >
              <Icon name="phone" size={11} color="var(--pc-info)" />
              {row.customerPhone}
            </a>
          ) : (
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)' }}>
              No phone on file
            </span>
          )}
          {showTowerTag && (
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', letterSpacing: '0.04em' }}>
              {row.tower} · {row.societyName}
            </span>
          )}
        </div>
      </div>

      {/* "Car isn't here." Only offered on work that's actually due — there is
          nothing to report about a slot you'll be standing at tomorrow. */}
      {!locked && (
        <button
          type="button"
          onClick={() => onSetUnavailable(!row.unavailable)}
          disabled={busy}
          aria-label={row.unavailable ? 'Car is here after all' : 'Car not available'}
          title={row.unavailable ? 'Car is here after all' : 'Car not available'}
          style={{
            flexShrink: 0, width: 28, height: 28, borderRadius: 6,
            border: 'none', background: 'transparent',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon
            name={row.unavailable ? 'repeat' : 'x-circle'}
            size={15}
            color={row.unavailable ? 'var(--pc-fg-3)' : 'var(--pc-danger)'}
          />
        </button>
      )}

      <button
        type="button"
        onClick={onViewDetails}
        aria-label="View details"
        title="View details"
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 6,
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="file-text" size={15} color="var(--pc-fg-3)" />
      </button>
    </div>
  );
}

// Full-detail popup for one car — everything CarRow doesn't already show
// inline (customer name, status) plus a duplicate of the visible fields, so
// a worker can read everything without hunting across a dense row.
function CarDetailsModal({ car, busy, onClose, onToggle, onSetUnavailable }: {
  car: WorkerTodoCar; busy: boolean; onClose: () => void;
  onToggle: () => void; onSetUnavailable: (unavailable: boolean) => void;
}) {
  const due = dueLabel(car, new Date());
  const done = car.status === 'done';
  const locked = !isCarActionableNow(car.dueBucket);
  const rows: [string, ReactNode][] = [
    ['Customer',     car.customerName || '—'],
    ['Phone',        car.customerPhone
      ? <a href={`tel:${car.customerPhone}`} style={{ color: 'var(--pc-info)', textDecoration: 'none' }}>{car.customerPhone}</a>
      : 'No phone on file'],
    ['Flat',         car.unitNumber || '—'],
    ['Parking',      [car.parkingLevel, car.parkingNumber].filter(Boolean).join(' · ') || '—'],
    ['Vehicle',      `${car.carPlate || '—'}${(car.carMake || car.carModel) ? ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}` : ''}`],
    ['Tower',        `${car.tower} · ${car.societyName}`],
    ['Scheduled',    car.scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })],
    ['Time',         formatSlot(car.preferredTime)],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
          borderRadius: '16px 16px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: car.unavailable ? 'var(--pc-danger)' : due.color, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
              {done ? 'Cleaned' : car.unavailable ? 'Not available' : due.text}
            </p>
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>
              Flat {car.unitNumber || '—'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--pc-fg-3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', textAlign: 'right' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* A future day's car is readable but not completable — see
            isCarActionableNow. Saying why beats a dead, greyed-out button. */}
        {!done && locked && (
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12.5, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
            This car is scheduled for{' '}
            {car.scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.
            You can tick it on that day.
          </p>
        )}

        {!done && !locked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!car.unavailable && (
              <button
                type="button"
                onClick={onToggle}
                disabled={busy}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  border: 'none', background: 'var(--pc-sage-hi)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                  color: 'var(--pc-ink)', letterSpacing: '0.04em',
                  cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? '…' : 'MARK CLEAN'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onSetUnavailable(!car.unavailable)}
              disabled={busy}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14,
                background: 'transparent',
                border: `1px solid ${car.unavailable ? 'var(--pc-line-strong)' : 'var(--pc-danger)'}`,
                fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                color: car.unavailable ? 'var(--pc-fg)' : 'var(--pc-danger)', letterSpacing: '0.04em',
                cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? '…' : car.unavailable ? 'CAR IS HERE AFTER ALL' : 'CAR NOT AVAILABLE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TodoGroup({ title, color, rows, subtitle, actingId, showTowerTag, onToggle, onSetUnavailable, onViewDetails }: {
  title: string; color: string; rows: WorkerTodoCar[]; subtitle?: string;
  actingId: string | null; showTowerTag: boolean;
  onToggle: (row: WorkerTodoCar) => void;
  onSetUnavailable: (row: WorkerTodoCar, unavailable: boolean) => void;
  onViewDetails: (row: WorkerTodoCar) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <Eyebrow color={color} style={{ display: 'block', marginBottom: subtitle ? 4 : 8 }}>
        {title} · {rows.length}
      </Eyebrow>
      {subtitle && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        {rows.map((row, i) => (
          <CarRow
            key={rowKey(row)}
            row={row}
            isFirst={i === 0}
            busy={actingId === rowKey(row)}
            showTowerTag={showTowerTag}
            onToggle={() => onToggle(row)}
            onSetUnavailable={u => onSetUnavailable(row, u)}
            onViewDetails={() => onViewDetails(row)}
          />
        ))}
      </div>
    </div>
  );
}

export default function WorkerDashboard() {
  const { worker, user } = useWorkerAuth();
  const [logs,     setLogs]     = useState<LogRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detailsCar, setDetailsCar] = useState<WorkerTodoCar | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Single source of "when is it" for the whole page — see useNowTick.
  const now = useNowTick();
  // Changes exactly once per calendar day, so the logs listener below
  // re-subscribes at midnight instead of staying pinned to the day the tab
  // was opened. Using `now` itself here would re-subscribe every 5 minutes.
  const dayKey = now.toDateString();

  // Live cleaning sessions this worker is assigned to (any tower/society) —
  // this is the actual source of truth for assignment, independent of the
  // single static worker.assignedSocietyId field below. Without this, a
  // worker assigned to two towers on the same day had no way to see either
  // one on their own dashboard.
  // No status filter — resolveWorkerTodoCars below does its own
  // done/missed/date filtering, and needs sessions from *any* date (not just
  // today) to surface overdue work that was previously invisible here.
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'cleaningSessions'), where('workerIds', 'array-contains', user.uid)),
      snap => setSessions(snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as SessionRow))),
      err => console.warn('[WorkerDashboard] sessions listener:', err),
    );
  }, [user]);

  // Today's cleaning logs for this worker
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'cleaningLogs'),
      where('workerId', '==', user.uid),
      where('cleanedAt', '>=', todayStart()),
      orderBy('cleanedAt', 'desc'),
      limit(200),
    );
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LogRow)));
      setLoading(false);
    }, err => { console.warn('[WorkerDashboard] logs listener:', err); setLoading(false); });
    // dayKey: re-subscribe when the calendar day rolls over, so "cleaned
    // today" resets overnight instead of carrying yesterday's count.
  }, [user, dayKey]);

  // See resolveTodaysSocieties (@pc/firebase) — used here only to tell "no
  // assignment at all" apart from "assigned, just nothing due right now".
  const assignedSocieties = worker ? resolveTodaysSocieties(worker, sessions) : [];

  async function toggleOnline() {
    if (!user || !worker) return;
    setToggling(true);
    await updateDoc(doc(db, 'workers', user.uid), { isOnline: !worker.isOnline });
    setToggling(false);
  }

  // Marks one car clean via the worker-scoped, server-validated
  // /api/session/[id] route — driven per-row here instead of per-session,
  // but the auth/side-effect guarantees (cleaningLogs entry, billing,
  // notifications) stay in one place.
  async function markClean(row: WorkerTodoCar) {
    if (!user) return;
    setActingId(rowKey(row));
    setActionError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/session/${row.sessionId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        // carPlate picks out WHICH of a flat's vehicles this is — see rowKey.
        body:    JSON.stringify({ action: 'clean_car', customerId: row.customerId, carPlate: row.carPlate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed.');
      // Optimistic local update — the sessions listener above will confirm
      // the same values shortly after via Firestore. Matched on plate as well
      // as customerId so cleaning a flat's car doesn't also tick off its
      // two-wheeler.
      setSessions(prev => prev.map(s => s.id === row.sessionId
        ? {
            ...s,
            completedCars: data.completedCars,
            totalCars:     data.totalCars,
            status:        data.status,
            cars: s.cars.map(c => c.customerId === row.customerId && c.carPlate === row.carPlate ? { ...c, status: 'done' } : c),
          }
        : s));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  // "The car isn't in its slot." Records the same `unavailable` flag the
  // admin's Live Cleaning board writes, so the car drops off the actionable
  // list instead of sitting there and later reading as a car the worker
  // skipped. Reversible — pass unavailable: false to put it back.
  async function setUnavailable(row: WorkerTodoCar, unavailable: boolean) {
    if (!user) return;
    setActingId(rowKey(row));
    setActionError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/session/${row.sessionId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action: 'set_car_unavailable', customerId: row.customerId, carPlate: row.carPlate, unavailable }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed.');
      // Optimistic local update, plate-matched for the same multi-vehicle
      // reason markClean is — the sessions listener confirms shortly after.
      setSessions(prev => prev.map(s => s.id === row.sessionId
        ? {
            ...s,
            totalCars: data.totalCars,
            status:    data.status,
            cars: s.cars.map(c => c.customerId === row.customerId && c.carPlate === row.carPlate ? { ...c, unavailable } : c),
          }
        : s));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  // Reverses an accidental tap — puts the car back to pending in its
  // session and removes the cleaningLog entry the mark-clean created.
  // Server-side re-checks the same-worker + time-window guardrails; this is
  // just the UI trigger.
  async function undoClean(log: LogRow) {
    if (!user || !log.sessionId) return;
    setActingId(logKey(log));
    setActionError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/session/${log.sessionId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action: 'undo_car', customerId: log.customerId, logId: log.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed.');
      // Optimistic local update — the cars/logs listeners above confirm shortly after.
      setSessions(prev => prev.map(s => s.id === log.sessionId
        ? {
            ...s,
            completedCars: data.completedCars,
            totalCars:     data.totalCars,
            status:        data.status,
            // Plate-matched for the same reason markClean is — a flat's two
            // vehicles share a customerId.
            cars: s.cars.map(c => c.customerId === log.customerId && c.carPlate === log.vehicleRegistration ? { ...c, status: 'pending' } : c),
          }
        : s));
      setLogs(prev => prev.filter(l => l.id !== log.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  // includeUnavailable: cars reported "not available" stay on screen in their
  // own group at the bottom, so a mis-tap can be undone and so the worker can
  // see what they've already accounted for. They are filtered out of every
  // count and of the actionable groups below.
  const todoCars = sortTodoCars(resolveWorkerTodoCars(sessions, now, { includeUnavailable: true }), now);

  // Tower picker counts. The headline number is *today's* open cars only —
  // it has to agree with the TODAY group directly below it. Rolling missed
  // cars into it made a tower read "47" while today's list held 12, which is
  // how a two-day backlog silently became the worker's headline workload.
  // Missed is still surfaced, as its own smaller red count. Tomorrow and
  // later are excluded from both: they aren't due yet.
  const towerCounts = (() => {
    const map = new Map<string, { key: string; tower: string; societyName: string; count: number; missed: number }>();
    for (const c of todoCars) {
      if (c.unavailable) continue;
      if (c.dueBucket !== 'overdue' && c.dueBucket !== 'today') continue;
      const key = `${c.societyId}::${c.tower}`;
      const entry = map.get(key) ?? { key, tower: c.tower, societyName: c.societyName, count: 0, missed: 0 };
      if (c.dueBucket === 'today') entry.count += 1;
      else entry.missed += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => (b.count - a.count) || (b.missed - a.missed));
  })();
  const showTowerPicker = towerCounts.length > 1;

  // Free-text search over the checklist — "b2" / "basement 2" narrows to the
  // level the worker is standing on, and flat / tower / car number all work
  // the same way (see buildCarSearchMatcher). Null when the box is empty.
  const searchMatcher = buildCarSearchMatcher(search);
  const towerFiltered = selectedTower
    ? todoCars.filter(c => `${c.societyId}::${c.tower}` === selectedTower)
    : todoCars;
  const visibleCars = searchMatcher ? towerFiltered.filter(searchMatcher) : towerFiltered;
  // Would dropping the tower filter turn an empty search into a non-empty
  // one? Drives the "Search all towers" escape hatch below.
  const hiddenByTower = Boolean(
    searchMatcher && selectedTower && visibleCars.length === 0 && todoCars.some(searchMatcher),
  );

  // Parking-level quick filters. A worker walks down to one level and wants
  // only that level's cars — the single most-repeated request from the
  // ground ("basement 2 me gaya to sirf basement 2 ki car dikhe"). Typing
  // "b2" already does exactly this, so a chip just writes the level's own
  // label into the search box rather than introducing a second filter that
  // could disagree with what the box says. Levels come from the cars the
  // worker can actually see, so a tower with no basement never shows a B2
  // chip. Counts ignore the search so the chips don't shuffle as you type.
  const levelChips = (() => {
    const map = new Map<string, { label: string; short: string; count: number }>();
    for (const c of towerFiltered) {
      if (c.unavailable) continue;
      const label = (c.parkingLevel ?? '').trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const entry = map.get(key) ?? { label, short: shortLevelLabel(label), count: 0 };
      entry.count += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.short.localeCompare(b.short, 'en', { numeric: true }));
  })();
  const activeLevel = search.trim().toLowerCase();
  // A search can pull rows in from any tower, so the tower tag stays on even
  // when the worker only has one.
  const showTowerTag = showTowerPicker || Boolean(searchMatcher);
  const openCars     = visibleCars.filter(c => !c.unavailable);
  const overdueRows  = openCars.filter(c => c.dueBucket === 'overdue');
  const todayRows    = openCars.filter(c => c.dueBucket === 'today');
  const tomorrowRows = openCars.filter(c => c.dueBucket === 'tomorrow');
  const laterRows    = openCars.filter(c => c.dueBucket === 'later');
  // Reported not available — today's and earlier only. A future session's car
  // can't be flagged in the first place, so nothing lands here from ahead.
  const unavailableRows = visibleCars.filter(c => c.unavailable);

  const doneToday = logs.length;

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 'var(--pc-space-3)' }}>
        <div>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 4px' }}>{greeting},</p>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
            {worker?.name?.split(' ')[0] ?? 'Worker'}.
          </h1>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          disabled={toggling}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 999,
            background: worker?.isOnline ? 'rgba(111,174,106,0.15)' : 'var(--pc-card)',
            border: `1px solid ${worker?.isOnline ? 'rgba(111,174,106,0.4)' : 'var(--pc-line-strong)'}`,
            cursor: toggling ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            color: worker?.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-3)',
          }}
        >
          <div aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: worker?.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-4)' }} />
          {worker?.isOnline ? 'Online' : 'Go Online'}
        </button>
      </div>

      {actionError && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)', margin: 0 }}>{actionError}</p>
      )}

      {/* Search — pinned below the app bar rather than scrolling away with the
          page. A tower runs to 300 rows, so by the time a worker has walked
          down to a level and wants to filter, an in-flow search box is
          hundreds of pixels above them. `top` matches the 56px sticky header
          in worker/layout.tsx. */}
      {todoCars.length > 0 && (
        <div
          style={{
            position: 'sticky', top: 56, zIndex: 30,
            margin: '0 calc(-1 * var(--pc-screen-pad-lg))',
            padding: '10px var(--pc-screen-pad-lg)',
            background: 'var(--pc-ink)',
            borderBottom: '1px solid var(--pc-line-faint)',
          }}
        >
          <CarSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Flat, parking level, car number…"
            hint={searchMatcher
              ? `${visibleCars.length} car${visibleCars.length === 1 ? '' : 's'} match`
              : undefined}
          />

          {levelChips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                Level
              </span>
              {levelChips.map(chip => {
                const active = activeLevel === chip.label.toLowerCase();
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSearch(active ? '' : chip.label)}
                    aria-pressed={active}
                    title={chip.label}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                      minHeight: 32, padding: '0 12px', borderRadius: 999,
                      background: active ? 'var(--pc-sage)' : 'var(--pc-card)',
                      border: `1px solid ${active ? 'var(--pc-sage)' : 'var(--pc-line-strong)'}`,
                      cursor: 'pointer',
                      fontFamily: 'var(--pc-sans)', fontSize: 12.5, fontWeight: 600,
                      color: active ? 'var(--pc-sage-ink)' : 'var(--pc-fg)',
                    }}
                  >
                    {chip.short}
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, fontWeight: 400, opacity: 0.7 }}>
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tower picker — mirrors a to-do app's list sidebar (name + open count);
          tapping one filters the checklist below to just that tower. */}
      {showTowerPicker && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Eyebrow>YOUR TOWERS</Eyebrow>
            {selectedTower && (
              <button
                type="button"
                onClick={() => setSelectedTower(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-sage-hi)' }}
              >
                Show all
              </button>
            )}
          </div>
          <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 14, overflow: 'hidden' }}>
            {towerCounts.map((t, i) => {
              const active = selectedTower === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTower(active ? null : t.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', background: active ? 'var(--pc-card-hi)' : 'transparent',
                    border: 'none', borderTop: i === 0 ? 'none' : '1px solid var(--pc-line-faint)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Icon name="list-checks" size={16} color={active ? 'var(--pc-sage-hi)' : 'var(--pc-fg-3)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.tower}
                    </p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: '1px 0 0' }}>
                      {t.societyName}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-3)' }}>
                      {t.count}
                    </span>
                    {t.missed > 0 && (
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10.5, fontWeight: 600, color: 'var(--pc-danger)', margin: '1px 0 0' }}>
                        {t.missed} missed
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-car to-do checklist: Today / Tomorrow / Upcoming, then Missed
          last — see BUCKET_ORDER for why the missed pile sits at the bottom. */}
      {visibleCars.length > 0 && (
        <div>
          <TodoGroup title="TODAY"    color="var(--pc-fg-3)"   rows={todayRows}    actingId={actingId} showTowerTag={showTowerTag} onToggle={markClean} onSetUnavailable={setUnavailable} onViewDetails={setDetailsCar} />
          {/* Tomorrow and later are shown so a worker can plan the round, but
              they are NOT tickable — see isCarActionableNow. A clean recorded
              against a day that hasn't happened makes the car read done when
              that day arrives, and it never gets washed. */}
          <TodoGroup
            title="TOMORROW"
            color="var(--pc-fg-4)"
            rows={tomorrowRows}
            subtitle="Coming up — tick these tomorrow, not today."
            actingId={actingId}
            showTowerTag={showTowerTag}
            onToggle={markClean}
            onSetUnavailable={setUnavailable}
            onViewDetails={setDetailsCar}
          />
          <TodoGroup
            title="UPCOMING"
            color="var(--pc-fg-4)"
            rows={laterRows}
            subtitle="Scheduled for a later day. Each one becomes tickable on its own day."
            actingId={actingId}
            showTowerTag={showTowerTag}
            onToggle={markClean}
            onSetUnavailable={setUnavailable}
            onViewDetails={setDetailsCar}
          />
          {/* Missed on an earlier day. Kept on the checklist (and tappable)
              rather than archived, so nothing an admin needs to chase can
              silently disappear — but parked below today's round. */}
          <TodoGroup
            title="MISSED"
            color="var(--pc-danger)"
            rows={overdueRows}
            subtitle="Missed on an earlier day. Each car comes back on its next scheduled day — tap one here only if you are cleaning it now."
            actingId={actingId}
            showTowerTag={showTowerTag}
            onToggle={markClean}
            onSetUnavailable={setUnavailable}
            onViewDetails={setDetailsCar}
          />
          {/* Cars the worker (or an admin) reported as not in their slot.
              Kept visible so a mis-tap can be undone, and so the round reads
              as accounted-for rather than half-finished. */}
          <TodoGroup
            title="NOT AVAILABLE"
            color="var(--pc-fg-4)"
            rows={unavailableRows}
            subtitle="Car was not in its parking slot. Tap the arrow to put one back if it turns up."
            actingId={actingId}
            showTowerTag={showTowerTag}
            onToggle={markClean}
            onSetUnavailable={setUnavailable}
            onViewDetails={setDetailsCar}
          />

          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', textAlign: 'center', margin: '4px 0 0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {doneToday} car{doneToday !== 1 ? 's' : ''} cleaned today
          </p>
        </div>
      )}

      {/* Nothing matched the search — kept distinct from "all caught up", which
          would otherwise read as "no work left" when work simply isn't on
          screen. */}
      {!loading && searchMatcher && visibleCars.length === 0 && (
        <Card style={{ padding: 'var(--pc-space-8)', textAlign: 'center' }}>
          <Icon name="search" size={28} color="var(--pc-fg-4)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No match.</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 12px', lineHeight: 1.6 }}>
            {hiddenByTower
              ? 'No cars match in this tower — but other towers have matches.'
              : 'Try a parking level (B1, B2, G), a flat number, or part of the car number.'}
          </p>
          <button
            type="button"
            onClick={() => (hiddenByTower ? setSelectedTower(null) : setSearch(''))}
            style={{
              padding: '10px 18px', borderRadius: 999, minHeight: 44,
              background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line-strong)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
              color: 'var(--pc-fg)', cursor: 'pointer',
            }}
          >
            {hiddenByTower ? 'Search all towers' : 'Clear search'}
          </button>
        </Card>
      )}

      {!loading && !searchMatcher && assignedSocieties.length > 0 && visibleCars.length === 0 && (
        <Card style={{ padding: 'var(--pc-space-8)', textAlign: 'center' }}>
          <Icon name="check-circle" size={32} color="var(--pc-success)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: '0 0 8px' }}>All caught up.</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 4px', lineHeight: 1.6 }}>
            No cars left to clean right now.
          </p>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {doneToday} car{doneToday !== 1 ? 's' : ''} cleaned today
          </p>
        </Card>
      )}

      {/* Full future/past browsing lives on the calendar page — this dashboard
          stays focused on "what do I do right now". */}
      <Link href="/worker/calendar" style={{ textDecoration: 'none' }}>
        <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="calendar" size={16} color="var(--pc-fg-3)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>
              View full calendar
            </p>
          </div>
          <Icon name="arrow-right" size={14} color="var(--pc-fg-3)" />
        </Card>
      </Link>

      {assignedSocieties.length === 0 && (
        <Card style={{ padding: 'var(--pc-space-8)', textAlign: 'center' }}>
          <Icon name="building-2" size={32} color="var(--pc-fg-4)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No society assigned.</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.6 }}>
            Contact your admin to get assigned to a society before starting your shift.
          </p>
        </Card>
      )}

      {/* Recent cleaning log */}
      {logs.length > 0 && (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 10 }}>RECENT CLEANS · TODAY</Eyebrow>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '-4px 0 10px' }}>
            Tapped one by mistake? Tap the checkmark to undo it.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.slice(0, 10).map(log => {
              const undoBusy = actingId === logKey(log);
              const canUndo  = Boolean(log.sessionId);
              return (
                <Card key={log.id} style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => canUndo && undoClean(log)}
                      disabled={!canUndo || undoBusy}
                      aria-label={canUndo ? 'Undo this clean' : 'Cleaned'}
                      title={canUndo ? 'Undo' : undefined}
                      style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: 'rgba(111,174,106,0.15)', border: '1px solid rgba(111,174,106,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: canUndo && !undoBusy ? 'pointer' : 'default',
                        opacity: undoBusy ? 0.5 : 1,
                        padding: 0,
                      }}
                    >
                      <Icon name={canUndo ? 'repeat' : 'check'} size={12} color="var(--pc-success)" />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.unitNumber} · {log.customerName}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.04em' }}>
                        {log.vehicleRegistration}
                        {(log.vehicleMake || log.vehicleModel) && ` · ${[log.vehicleMake, log.vehicleModel].filter(Boolean).join(' ')}`}
                      </p>
                    </div>
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
                      {formatTime(log.cleanedAt as unknown as Timestamp)}
                    </span>
                  </div>
                </Card>
              );
            })}
            {logs.length > 10 && (
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', textAlign: 'center', margin: 0 }}>
                +{logs.length - 10} more cleans today
              </p>
            )}
          </div>
        </div>
      )}

      {detailsCar && (
        <CarDetailsModal
          car={detailsCar}
          busy={actingId === rowKey(detailsCar)}
          onClose={() => setDetailsCar(null)}
          onToggle={() => { markClean(detailsCar); setDetailsCar(null); }}
          onSetUnavailable={u => { setUnavailable(detailsCar, u); setDetailsCar(null); }}
        />
      )}
    </div>
  );
}
