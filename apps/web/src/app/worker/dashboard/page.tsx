'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { db, resolveTodaysSocieties, resolveWorkerTodoCars, getCarUrgency, buildCarSearchMatcher } from '@pc/firebase';
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

function formatTime(ts: Timestamp | Date | null | undefined): string {
  if (!ts) return '—';
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
    // Not due yet, but a worker can still tap it early for an emergency
    // clean — getCarUrgency's same-day hour math doesn't apply here since
    // this row's scheduledDate is a future day, not today.
    const dateStr = row.scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return { text: `${dateStr} · ${time}`, color: 'var(--pc-fg-4)' };
  }
  const urgency = getCarUrgency(row.preferredTime, row.status, now);
  if (urgency === 'overdue')  return { text: `Overdue · ${time}`,  color: URGENCY_COLOR.overdue };
  if (urgency === 'due-soon') return { text: `Due soon · ${time}`, color: URGENCY_COLOR['due-soon'] };
  return { text: time, color: 'var(--pc-fg-3)' };
}

const BUCKET_ORDER: Record<CarDueBucket, number> = { overdue: 0, today: 1, tomorrow: 2, later: 3 };
const URGENCY_ORDER: Record<CarUrgency, number> = { overdue: 0, 'due-soon': 1, later: 2, done: 3 };

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

function CarRow({ row, isFirst, busy, showTowerTag, onToggle, onViewDetails }: {
  row: WorkerTodoCar; isFirst: boolean; busy: boolean; showTowerTag: boolean; onToggle: () => void; onViewDetails: () => void;
}) {
  const due = dueLabel(row, new Date());
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      borderTop: isFirst ? 'none' : '1px solid var(--pc-line-faint)',
    }}>
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
function CarDetailsModal({ car, busy, onClose, onToggle }: {
  car: WorkerTodoCar; busy: boolean; onClose: () => void; onToggle: () => void;
}) {
  const due = dueLabel(car, new Date());
  const done = car.status === 'done';
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
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: due.color, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
              {done ? 'Cleaned' : due.text}
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

        {!done && (
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
      </div>
    </div>
  );
}

function TodoGroup({ title, color, rows, actingId, showTowerTag, onToggle, onViewDetails }: {
  title: string; color: string; rows: WorkerTodoCar[]; actingId: string | null; showTowerTag: boolean;
  onToggle: (row: WorkerTodoCar) => void; onViewDetails: (row: WorkerTodoCar) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <Eyebrow color={color} style={{ display: 'block', marginBottom: 8 }}>
        {title} · {rows.length}
      </Eyebrow>
      <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        {rows.map((row, i) => (
          <CarRow
            key={`${row.sessionId}-${row.customerId}`}
            row={row}
            isFirst={i === 0}
            busy={actingId === row.customerId}
            showTowerTag={showTowerTag}
            onToggle={() => onToggle(row)}
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
  }, [user]);

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
    setActingId(row.customerId);
    setActionError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/session/${row.sessionId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action: 'clean_car', customerId: row.customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed.');
      // Optimistic local update — the sessions listener above will confirm
      // the same values shortly after via Firestore.
      setSessions(prev => prev.map(s => s.id === row.sessionId
        ? {
            ...s,
            completedCars: data.completedCars,
            totalCars:     data.totalCars,
            status:        data.status,
            cars: s.cars.map(c => c.customerId === row.customerId ? { ...c, status: 'done' } : c),
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
    setActingId(log.customerId);
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
            cars: s.cars.map(c => c.customerId === log.customerId ? { ...c, status: 'pending' } : c),
          }
        : s));
      setLogs(prev => prev.filter(l => l.id !== log.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const todoCars = sortTodoCars(resolveWorkerTodoCars(sessions, now), now);

  // Tower picker counts — Overdue + Today only, per the earlier "A tower · 77"
  // reference: tomorrow's cars aren't due yet, so they don't inflate a count
  // that's meant to answer "how much is left for this tower right now".
  const towerCounts = (() => {
    const map = new Map<string, { key: string; tower: string; societyName: string; count: number }>();
    for (const c of todoCars) {
      if (c.dueBucket !== 'overdue' && c.dueBucket !== 'today') continue;
      const key = `${c.societyId}::${c.tower}`;
      const entry = map.get(key) ?? { key, tower: c.tower, societyName: c.societyName, count: 0 };
      entry.count += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
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
  // A search can pull rows in from any tower, so the tower tag stays on even
  // when the worker only has one.
  const showTowerTag = showTowerPicker || Boolean(searchMatcher);
  const overdueRows  = visibleCars.filter(c => c.dueBucket === 'overdue');
  const todayRows    = visibleCars.filter(c => c.dueBucket === 'today');
  const tomorrowRows = visibleCars.filter(c => c.dueBucket === 'tomorrow');
  const laterRows    = visibleCars.filter(c => c.dueBucket === 'later');

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

      {/* Search — sits above the lists so a worker who has walked down to a
          level can type "b2" and see only that level's cars. */}
      {todoCars.length > 0 && (
        <CarSearchInput
          value={search}
          onChange={setSearch}
          hint={searchMatcher
            ? `${visibleCars.length} car${visibleCars.length === 1 ? '' : 's'} match`
            : 'Type B1, B2 or G for a parking level — or a flat, tower or car number.'}
        />
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
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-car to-do checklist, grouped Overdue / Today / Tomorrow */}
      {visibleCars.length > 0 && (
        <div>
          <TodoGroup title="OVERDUE"  color="var(--pc-danger)" rows={overdueRows}  actingId={actingId} showTowerTag={showTowerTag} onToggle={markClean} onViewDetails={setDetailsCar} />
          <TodoGroup title="TODAY"    color="var(--pc-fg-3)"   rows={todayRows}    actingId={actingId} showTowerTag={showTowerTag} onToggle={markClean} onViewDetails={setDetailsCar} />
          <TodoGroup title="TOMORROW" color="var(--pc-fg-4)"   rows={tomorrowRows} actingId={actingId} showTowerTag={showTowerTag} onToggle={markClean} onViewDetails={setDetailsCar} />
          {/* Everything further out — a worker can still tap one early for an
              emergency clean, so these stay actionable rather than hidden
              behind the calendar page. */}
          <TodoGroup title="UPCOMING" color="var(--pc-fg-4)"   rows={laterRows}    actingId={actingId} showTowerTag={showTowerTag} onToggle={markClean} onViewDetails={setDetailsCar} />

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
              const undoBusy = actingId === log.customerId;
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
          busy={actingId === detailsCar.customerId}
          onClose={() => setDetailsCar(null)}
          onToggle={() => { markClean(detailsCar); setDetailsCar(null); }}
        />
      )}
    </div>
  );
}
