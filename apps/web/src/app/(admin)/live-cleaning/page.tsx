'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, onSnapshot, doc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, resolveTowerGroups, getCarUrgency, getSessionDayBucket } from '@pc/firebase';
import type { CleaningSession, CleaningSessionCar, TowerGroupSummary, CarUrgency, CarDueBucket, VehicleCategory } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import { notifyCarCleaned } from '@/lib/notification';

interface CarListItem {
  sessionId: string;
  carIndex: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  unitNumber: string;
  parkingNumber: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  vehicleCategory: VehicleCategory;
  preferredTime: number;
  status: string;
  unavailable?: boolean;
  societyId: string;
  societyName: string;
  tower: string;
  sessionType: 'wash' | 'deep-clean';
  dueBucket: CarDueBucket;
  scheduledDate: Date;
}

const BUCKETS: { key: CarDueBucket; label: string; color: string }[] = [
  { key: 'overdue',  label: 'OVERDUE',  color: 'var(--pc-danger)' },
  { key: 'today',    label: 'TODAY',    color: 'var(--pc-fg-3)'   },
  { key: 'tomorrow', label: 'TOMORROW', color: 'var(--pc-fg-4)'   },
  { key: 'later',    label: 'UPCOMING', color: 'var(--pc-fg-4)'   },
];

function formatSlot(hour: number): string {
  const h    = Math.floor(hour);
  const m    = Math.round((hour % 1) * 60);
  const h12  = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const URGENCY_LABEL: Record<CarUrgency, string> = { overdue: 'Overdue', 'due-soon': 'Due', later: '', done: '' };
const URGENCY_COLOR: Record<CarUrgency, string> = { overdue: 'var(--pc-danger)', 'due-soon': 'var(--pc-info)', later: 'var(--pc-fg-3)', done: 'var(--pc-fg-3)' };

// Due-line under a car row — Today reuses getCarUrgency's same-day hour math
// (unchanged from before); Overdue/Tomorrow/Upcoming show the car's own
// scheduled date instead, since urgency's hour-of-day comparison only means
// something when the session is actually dated today.
function DueLine({ car }: { car: CarListItem }) {
  if (car.dueBucket === 'overdue') {
    const dateStr = car.scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return (
      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--pc-danger)', margin: '3px 0 0' }}>
        Overdue · {dateStr}
      </p>
    );
  }
  if (car.dueBucket === 'tomorrow') {
    return (
      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
        Tomorrow · {formatSlot(car.preferredTime)}
      </p>
    );
  }
  if (car.dueBucket === 'later') {
    const dateStr = car.scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return (
      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
        {dateStr} · {formatSlot(car.preferredTime)}
      </p>
    );
  }
  const urgency = getCarUrgency(car.preferredTime, car.status as CleaningSessionCar['status']);
  if (urgency === 'later') {
    return (
      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
        {formatSlot(car.preferredTime)}
      </p>
    );
  }
  return (
    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, fontWeight: 600, color: URGENCY_COLOR[urgency], margin: '3px 0 0' }}>
      {URGENCY_LABEL[urgency]} · {formatSlot(car.preferredTime)}
    </p>
  );
}

// One tower's card — list header (name + open count) plus its checklist.
// Extracted so it can be rendered once per bucket without duplicating this
// markup four times.
function TowerGroupCard({ group, cars, workers, bucket, marking, toggling, isUnavailable, onMarkDone, onToggleUnavailable, onViewDetails }: {
  group: TowerGroupSummary;
  cars: CarListItem[];
  workers: { id: string; name: string; phone?: string }[];
  bucket: CarDueBucket;
  marking: string | null;
  toggling: string | null;
  isUnavailable: (c: CarListItem) => boolean;
  onMarkDone: (c: CarListItem) => void;
  onToggleUnavailable: (c: CarListItem) => void;
  onViewDetails: (c: CarListItem) => void;
}) {
  return (
    <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 12, overflow: 'hidden' }}>
      {/* List header — name + open count, like a to-do "list" row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Icon name="list-checks" size={16} color="var(--pc-fg-3)" />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>
              {group.tower}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: '1px 0 0' }}>
              {group.societyName}
            </p>
          </div>
        </div>
        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
          {group.openCars}
        </span>
      </div>

      {/* Assigned worker(s) — name + tap-to-call, or an explicit Unassigned flag */}
      <div style={{ borderTop: '1px solid var(--pc-line)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>
            Assigned
          </span>
          {workers.length === 0 ? (
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)' }}>
              Unassigned
            </span>
          ) : (
            workers.map(w => (
              <span
                key={w.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
                  borderRadius: 999, padding: '3px 8px 3px 10px',
                }}
              >
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg)' }}>{w.name || 'Worker'}</span>
                {w.phone ? (
                  <a
                    href={`tel:${w.phone}`}
                    title={`Call ${w.name || 'worker'}`}
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--pc-info)' }}
                  >
                    <Icon name="phone" size={11} color="var(--pc-info)" />
                  </a>
                ) : null}
              </span>
            ))
          )}
        </div>
        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
          {bucket === 'today' ? 'Sorted by urgency' : 'Sorted by time'}
        </span>
      </div>

      {/* Checklist rows */}
      {cars.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>
          No cars scheduled
        </div>
      ) : (
        <div>
          {cars.map((car, idx) => {
            const isDone = car.status === 'done';
            const unavailable = isUnavailable(car);
            const busy = marking === `${car.sessionId}-${car.carIndex}`;

            return (
              <div
                key={`${car.sessionId}-${car.carIndex}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderTop: idx > 0 ? '1px solid var(--pc-line-faint)' : 'none',
                  opacity: unavailable ? 0.45 : 1,
                }}
              >
                {/* Checkbox — click to mark done */}
                <button
                  type="button"
                  onClick={() => !isDone && !unavailable && onMarkDone(car)}
                  disabled={isDone || unavailable || busy}
                  title={isDone ? 'Cleaned' : 'Mark clean'}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${isDone ? 'var(--pc-sage-hi)' : 'var(--pc-line-strong)'}`,
                    background: isDone ? 'var(--pc-sage-hi)' : 'transparent',
                    cursor: isDone || unavailable ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {isDone && <Icon name="check" size={12} color="var(--pc-ink)" strokeWidth={2.5} />}
                </button>

                {/* Primary + secondary text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 14.5, color: 'var(--pc-fg)', margin: 0,
                    textDecoration: isDone ? 'line-through' : 'none',
                    textDecorationColor: 'var(--pc-fg-3)',
                  }}>
                    Flat {car.unitNumber || '—'}
                    {car.sessionType === 'deep-clean' && (
                      <span style={{ marginLeft: 8, fontFamily: 'var(--pc-mono)', fontSize: 8.5, letterSpacing: '0.05em', color: 'var(--pc-info)' }}>
                        DEEP CLEAN
                      </span>
                    )}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-fg-3)', margin: '2px 0 0', letterSpacing: '0.02em' }}>
                    {car.vehicleCategory === 'two-wheeler' && <Icon name="bike" size={10} color="var(--pc-fg-3)" />}
                    {car.vehicleCategory === 'two-wheeler' ? 'BIKE' : 'CAR'} {car.carPlate}{car.parkingNumber ? ` · PARKING ${car.parkingNumber}` : ''}
                    {(car.carMake || car.carModel) ? ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}` : ''}
                  </p>
                  {car.customerPhone && (
                    <a
                      href={`tel:${car.customerPhone}`}
                      onClick={e => e.stopPropagation()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-info)', textDecoration: 'none' }}
                    >
                      <Icon name="phone" size={10} color="var(--pc-info)" />
                      {car.customerPhone}
                    </a>
                  )}
                  {!isDone && !unavailable && <DueLine car={car} />}
                  {unavailable && (
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
                      {car.status === 'skipped' ? 'Not available' : 'Marked unavailable'}
                    </p>
                  )}
                </div>

                {/* View details — full car/customer info in a popup */}
                <button
                  type="button"
                  onClick={() => onViewDetails(car)}
                  title="View details"
                  style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name="file-text" size={15} color="var(--pc-fg-3)" />
                </button>

                {/* Unavailable toggle — hidden for auto-skipped cars, since that
                    comes from the customer's own skip date, not this toggle */}
                {car.status !== 'skipped' && (
                  <button
                    type="button"
                    onClick={() => onToggleUnavailable(car)}
                    disabled={toggling === `${car.sessionId}-${car.carIndex}`}
                    title={car.unavailable ? 'Mark available' : 'Mark unavailable'}
                    style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      border: 'none', background: 'transparent',
                      cursor: toggling ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: toggling === `${car.sessionId}-${car.carIndex}` ? 0.5 : 1,
                    }}
                  >
                    <Icon
                      name={car.unavailable ? 'x-circle' : 'star'}
                      size={15}
                      color={car.unavailable ? 'var(--pc-danger)' : 'var(--pc-fg-3)'}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Full-detail popup for one car — customer name, phone, flat, parking,
// vehicle, tower/society, and scheduled date/time, plus a Mark Clean action.
function CarDetailsModal({ car, busy, onClose, onMarkDone }: {
  car: CarListItem; busy: boolean; onClose: () => void; onMarkDone: () => void;
}) {
  const done = car.status === 'done';
  const unavailable = car.unavailable || car.status === 'skipped';
  const rows: [string, string][] = [
    ['Customer',  car.customerName || '—'],
    ['Phone',     car.customerPhone || 'No phone on file'],
    ['Flat',      car.unitNumber || '—'],
    ['Parking',   car.parkingNumber || '—'],
    ['Type',      car.vehicleCategory === 'two-wheeler' ? 'Two-wheeler' : 'Car'],
    ['Vehicle',   `${car.carPlate || '—'}${(car.carMake || car.carModel) ? ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}` : ''}`],
    ['Tower',     `${car.tower} · ${car.societyName}`],
    ['Scheduled', car.scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })],
    ['Time',      formatSlot(car.preferredTime)],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
          borderRadius: 16, padding: 20, boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
              {done ? 'Cleaned' : unavailable ? 'Unavailable' : 'Pending'}
            </p>
            <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>
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
                {label === 'Phone' && car.customerPhone
                  ? <a href={`tel:${car.customerPhone}`} style={{ color: 'var(--pc-info)', textDecoration: 'none' }}>{value}</a>
                  : value}
              </span>
            </div>
          ))}
        </div>

        {!done && !unavailable && (
          <button
            type="button"
            onClick={onMarkDone}
            disabled={busy}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10,
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

export default function LiveCleaningPage() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get('q') ?? '').trim().toLowerCase();
  const [sessions, setSessions] = useState<(CleaningSession & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSociety, setFilterSociety] = useState('all');
  const [filterTower, setFilterTower] = useState('all');
  const [societies, setSocieties] = useState<Set<string>>(new Set());
  const [towers, setTowers] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [detailsCar, setDetailsCar] = useState<CarListItem | null>(null);
  const [workersById, setWorkersById] = useState<Map<string, { name: string; phone?: string }>>(new Map());

  // Worker directory — looked up by id so each tower card can show a
  // tap-to-call number next to whoever's assigned, not just their name.
  useEffect(() => {
    return onSnapshot(collection(db, 'workers'), snap => {
      const map = new Map<string, { name: string; phone?: string }>();
      snap.docs.forEach(d => {
        const data = d.data() as { name?: string; phone?: string };
        map.set(d.id, { name: data.name ?? '', phone: data.phone });
      });
      setWorkersById(map);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, 'cleaningSessions'),
        where('status', 'in', ['scheduled', 'inprogress'])
      ),
      snap => {
        // No date filter here — a session that missed its date used to just
        // vanish once it was no longer "today", which is what made this
        // board go empty the moment today's sessions were all marked done.
        // Bucketing into Overdue/Today/Tomorrow/Upcoming happens below.
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CleaningSession & { id: string }));
        setSessions(data);

        const socs = new Set<string>();
        const twrs = new Set<string>();
        data.forEach(s => {
          socs.add(s.societyName);
          if (s.tower) twrs.add(s.tower);
        });
        setSocieties(socs);
        setTowers(twrs);
        setLoading(false);
      },
      err => {
        console.warn('[LiveCleaning]', err.message);
        setLoading(false);
      }
    );
  }, []);

  const now = new Date();

  function toDate(raw: unknown): Date {
    const r = raw as { toDate?: () => Date } | Date | string | number;
    return r && typeof (r as { toDate?: () => Date }).toDate === 'function'
      ? (r as { toDate: () => Date }).toDate()
      : new Date(r as string | number | Date);
  }

  const filteredSessions = sessions.filter(s => {
    if (filterSociety !== 'all' && s.societyName !== filterSociety) return false;
    if (filterTower !== 'all' && s.tower !== filterTower) return false;
    if (searchTerm) {
      const sessionMatch = [s.societyName, s.tower, s.id].some(value => String(value ?? '').toLowerCase().includes(searchTerm));
      const carMatch = (s.cars ?? []).some(car => [car.customerName, car.customerPhone, car.carPlate, car.unitNumber, car.parkingNumber, car.carMake, car.carModel]
        .some(value => String(value ?? '').toLowerCase().includes(searchTerm)));
      if (!sessionMatch && !carMatch) return false;
    }
    return true;
  });

  // A car counts as unavailable either via this board's own toggle, or because
  // it was auto-marked 'skipped' at session-build time (customer's skip date).
  const isUnavailable = (c: CarListItem) => c.unavailable || c.status === 'skipped';
  const urgencyOrder: Record<CarUrgency, number> = { overdue: 0, 'due-soon': 1, later: 2, done: 3 };

  // Buckets sessions into Overdue / Today / Tomorrow / Upcoming, then builds
  // each bucket's tower groups + per-tower checklist independently — merging
  // sessions from different days into one tower group would blend an overdue
  // count into a today count (see resolveTowerGroups' docstring).
  function buildBucket(bucket: CarDueBucket) {
    const bucketSessions = filteredSessions.filter(s => getSessionDayBucket(toDate(s.scheduledDate), now) === bucket);

    const towerGroups: TowerGroupSummary[] = resolveTowerGroups(bucketSessions);
    const carsByTowerKey = new Map<string, CarListItem[]>();
    const workersByTowerKey = new Map<string, Map<string, string>>(); // workerId -> name

    bucketSessions.forEach(session => {
      if (!session.societyId || !session.tower) return;
      const key = `${session.societyId}::${session.tower}`;
      const scheduledDate = toDate(session.scheduledDate);

      const list = carsByTowerKey.get(key) ?? [];
      (session.cars ?? []).forEach((car, idx) => {
        list.push({
          sessionId: session.id,
          carIndex: idx,
          customerId: car.customerId,
          customerName: car.customerName ?? '',
          customerPhone: car.customerPhone ?? '',
          unitNumber: car.unitNumber ?? '',
          parkingNumber: car.parkingNumber ?? '',
          carPlate: car.carPlate,
          carMake: car.carMake,
          carModel: car.carModel,
          vehicleCategory: car.vehicleCategory ?? 'car',
          preferredTime: car.preferredTime,
          status: car.status,
          unavailable: Boolean(car.unavailable),
          societyId: session.societyId,
          societyName: session.societyName,
          tower: session.tower,
          sessionType: session.sessionType ?? 'wash',
          dueBucket: bucket,
          scheduledDate,
        });
      });
      carsByTowerKey.set(key, list);

      const workerMap = workersByTowerKey.get(key) ?? new Map<string, string>();
      (session.workerIds ?? []).forEach((id, i) => {
        if (id) workerMap.set(id, session.workerNames?.[i] ?? '');
      });
      workersByTowerKey.set(key, workerMap);
    });

    // Sort: available cars first — by same-day urgency for Today, by
    // scheduled time otherwise (urgency's hour math only means something
    // when the session's date is actually today) — then unavailable.
    carsByTowerKey.forEach((cars, key) => {
      const available = cars
        .filter(c => !isUnavailable(c))
        .sort((a, b) => {
          if (bucket === 'today') {
            const ua = getCarUrgency(a.preferredTime, a.status as CleaningSessionCar['status']);
            const ub = getCarUrgency(b.preferredTime, b.status as CleaningSessionCar['status']);
            if (ua !== ub) return urgencyOrder[ua] - urgencyOrder[ub];
          }
          return a.preferredTime - b.preferredTime;
        });
      const unavailable = cars.filter(isUnavailable);
      carsByTowerKey.set(key, [...available, ...unavailable]);
    });

    return { towerGroups, carsByTowerKey, workersByTowerKey };
  }

  const bucketData: Record<CarDueBucket, ReturnType<typeof buildBucket>> = {
    overdue:  buildBucket('overdue'),
    today:    buildBucket('today'),
    tomorrow: buildBucket('tomorrow'),
    later:    buildBucket('later'),
  };
  const totalTowerGroups = BUCKETS.reduce((sum, b) => sum + bucketData[b.key].towerGroups.length, 0);

  async function toggleUnavailable(car: CarListItem) {
    if (toggling) return;
    setToggling(`${car.sessionId}-${car.carIndex}`);

    try {
      const sessionRef = doc(db, 'cleaningSessions', car.sessionId);
      await runTransaction(db, async tx => {
        const snap = await tx.get(sessionRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const currentCars = (data.cars ?? []) as Record<string, unknown>[];
        const target = currentCars[car.carIndex];
        // Can't toggle a car that's already cleaned, or one that's already
        // 'skipped' via the customer's own skipDate — this toggle is
        // ops-only and shouldn't override that.
        if (!target || target.status === 'done' || target.status === 'skipped') return;

        const makingUnavailable = !target.unavailable;
        const newCars = currentCars.map((c, idx) =>
          idx === car.carIndex ? { ...c, unavailable: makingUnavailable } : c
        );

        // Keeps totalCars an accurate denominator for "is this session fully
        // done" — an unavailable car can never be completed, same reasoning
        // as skippedCars being excluded from totalCars at creation time.
        // Without this, a tower with an unavailable car could never satisfy
        // completedCars >= totalCars and would sit 'inprogress' forever.
        const totalCars = (data.totalCars as number | undefined) ?? currentCars.length;
        tx.update(sessionRef, {
          cars: newCars,
          totalCars: makingUnavailable ? totalCars - 1 : totalCars + 1,
        });
      });
    } catch (err: unknown) {
      console.error('[LiveCleaning] toggle failed:', err instanceof Error ? err.message : err);
    } finally {
      setToggling(null);
    }
  }

  async function markDone(car: CarListItem) {
    if (marking) return;
    const key = `${car.sessionId}-${car.carIndex}`;
    setMarking(key);

    try {
      const sessionRef = doc(db, 'cleaningSessions', car.sessionId);
      await runTransaction(db, async tx => {
        const snap = await tx.get(sessionRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const currentCars = (data.cars ?? []) as Record<string, unknown>[];
        if (currentCars[car.carIndex]?.status === 'done') return;
        const newCars = currentCars.map((c, idx) =>
          idx === car.carIndex ? { ...c, status: 'done', cleanedAt: new Date() } : c
        );
        const completedCars = (data.completedCars ?? 0) + 1;
        const totalCars = data.totalCars ?? newCars.length;
        tx.update(sessionRef, {
          cars: newCars,
          completedCars,
          updatedAt: serverTimestamp(),
          ...(completedCars >= totalCars ? { status: 'done', completedAt: serverTimestamp() } : {}),
        });
      });

      // Write cleaningLog — rules now allow isAdmin() on cleaningLogs create
      await addDoc(collection(db, 'cleaningLogs'), {
        sessionId:           car.sessionId,
        societyId:           car.societyId,
        societyName:         car.societyName,
        tower:               car.tower,
        vehicleRegistration: car.carPlate,
        vehicleMake:         car.carMake,
        vehicleModel:        car.carModel,
        vehicleCategory:     car.vehicleCategory,
        customerId:          car.customerId,
        customerName:        '',
        unitNumber:          car.unitNumber,
        workerId:            '',
        workerName:          'Admin',
        cleanedAt:           serverTimestamp(),
        serviceType:         'exterior',
        servicePrice:        0,
        photoUrls:           [],
        notificationSent:    false,
        billed:              false,
      });

      // Look up the resident's phone for the SMS
      const recordsSnap = await getDocs(query(
        collection(db, 'customerSocietyRecords'),
        where('customerId', '==', car.customerId),
      ));
      const record: Record<string, unknown> | undefined =
        recordsSnap.docs.find(d => (d.data() as Record<string, unknown>).tower === car.tower)?.data() as Record<string, unknown> | undefined
        ?? recordsSnap.docs[0]?.data() as Record<string, unknown> | undefined;

      if (record?.customerPhone) {
        await notifyCarCleaned(
          record.customerPhone as string,
          (record.customerName as string | undefined) ?? 'there',
          car.carPlate,
          car.societyName,
          car.tower,
        ).catch(err => console.warn('[LiveCleaning] SMS notify failed:', err));
      }
    } catch (err: unknown) {
      console.error('[LiveCleaning] mark done failed:', err instanceof Error ? err.message : err);
    } finally {
      setMarking(null);
    }
  }

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
        <h1 className="admin-page-title">Live Cleaning Task Board</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
          Every not-done car, grouped by tower — overdue, today, tomorrow, and beyond. Mark unavailable to move to bottom.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            SOCIETY
          </label>
          <select
            value={filterSociety}
            onChange={e => setFilterSociety(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              boxSizing: 'border-box',
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)',
              borderRadius: 8,
              color: 'var(--pc-fg)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Societies</option>
            {Array.from(societies).sort().map(soc => (
              <option key={soc} value={soc}>{soc}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            TOWER
          </label>
          <select
            value={filterTower}
            onChange={e => setFilterTower(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              boxSizing: 'border-box',
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)',
              borderRadius: 8,
              color: 'var(--pc-fg)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Towers</option>
            {Array.from(towers).sort().map(tower => (
              <option key={tower} value={tower}>{tower}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lists — one section per day-bucket, one tower card per list inside each */}
      {loading ? (
        <Card style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
          Loading…
        </Card>
      ) : totalTowerGroups === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
          No cars need cleaning right now. Sessions start automatically at each tower’s configured time.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {BUCKETS.map(({ key, label, color }) => {
            const { towerGroups, carsByTowerKey, workersByTowerKey } = bucketData[key];
            if (towerGroups.length === 0) return null;

            return (
              <div key={key}>
                <Eyebrow color={color} style={{ display: 'block', marginBottom: 10 }}>
                  {label} · {towerGroups.length} tower{towerGroups.length === 1 ? '' : 's'}
                </Eyebrow>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
                  {towerGroups.map(group => (
                    <TowerGroupCard
                      key={group.key}
                      group={group}
                      cars={carsByTowerKey.get(group.key) ?? []}
                      workers={Array.from(workersByTowerKey.get(group.key) ?? []).map(([id, name]) => ({
                        id, name: name || workersById.get(id)?.name || '',
                        phone: workersById.get(id)?.phone,
                      }))}
                      bucket={key}
                      marking={marking}
                      toggling={toggling}
                      isUnavailable={isUnavailable}
                      onMarkDone={markDone}
                      onToggleUnavailable={toggleUnavailable}
                      onViewDetails={setDetailsCar}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailsCar && (
        <CarDetailsModal
          car={detailsCar}
          busy={marking === `${detailsCar.sessionId}-${detailsCar.carIndex}`}
          onClose={() => setDetailsCar(null)}
          onMarkDone={() => { markDone(detailsCar); setDetailsCar(null); }}
        />
      )}
    </div>
  );
}
