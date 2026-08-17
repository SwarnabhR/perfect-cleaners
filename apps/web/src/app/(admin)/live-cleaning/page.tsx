'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, resolveTodaysTowerGroups, getCarUrgency } from '@pc/firebase';
import type { CleaningSessionEnhanced, CleaningSessionCar, TowerGroupSummary, CarUrgency } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import { notifyCarCleaned } from '@/lib/notification';

interface CarListItem {
  sessionId: string;
  carIndex: number;
  customerId: string;
  unitNumber: string;
  parkingNumber: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number;
  status: string;
  unavailable?: boolean;
  societyId: string;
  societyName: string;
  tower: string;
  sessionType: 'wash' | 'deep-clean';
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatSlot(hour: number): string {
  const h    = Math.floor(hour);
  const m    = Math.round((hour % 1) * 60);
  const h12  = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const URGENCY_LABEL: Record<CarUrgency, string> = { overdue: 'Overdue', 'due-soon': 'Due', later: '', done: '' };
const URGENCY_COLOR: Record<CarUrgency, string> = { overdue: 'var(--pc-danger)', 'due-soon': 'var(--pc-info)', later: 'var(--pc-fg-3)', done: 'var(--pc-fg-3)' };

export default function LiveCleaningPage() {
  const [sessions, setSessions] = useState<(CleaningSessionEnhanced & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSociety, setFilterSociety] = useState('all');
  const [filterTower, setFilterTower] = useState('all');
  const [societies, setSocieties] = useState<Set<string>>(new Set());
  const [towers, setTowers] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, 'cleaningSessions'),
        where('status', 'in', ['scheduled', 'inprogress'])
      ),
      snap => {
        const today = new Date();
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as CleaningSessionEnhanced & { id: string }))
          .filter(s => {
            const raw = s.scheduledDate as unknown as { toDate?: () => Date } | Date | string | number;
            const d = raw && typeof (raw as { toDate?: () => Date }).toDate === 'function'
              ? (raw as { toDate: () => Date }).toDate()
              : new Date(raw as string | number | Date);
            return isSameDay(d, today);
          });
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

  const filteredSessions = sessions.filter(s => {
    if (filterSociety !== 'all' && s.societyName !== filterSociety) return false;
    if (filterTower !== 'all' && s.tower !== filterTower) return false;
    return true;
  });

  const towerGroups: TowerGroupSummary[] = resolveTodaysTowerGroups(filteredSessions);

  const carsByTowerKey = new Map<string, CarListItem[]>();
  const workersByTowerKey = new Map<string, Set<string>>();

  filteredSessions.forEach(session => {
    if (!session.societyId || !session.tower) return;
    const key = `${session.societyId}::${session.tower}`;

    const list = carsByTowerKey.get(key) ?? [];
    (session.cars ?? []).forEach((car, idx) => {
      list.push({
        sessionId: session.id,
        carIndex: idx,
        customerId: car.customerId,
        unitNumber: car.unitNumber ?? '',
        parkingNumber: car.parkingNumber ?? '',
        carPlate: car.carPlate,
        carMake: car.carMake,
        carModel: car.carModel,
        preferredTime: car.preferredTime,
        status: car.status,
        unavailable: Boolean((car as unknown as Record<string, unknown>)['unavailable']),
        societyId: session.societyId,
        societyName: session.societyName,
        tower: session.tower,
        sessionType: session.sessionType ?? 'wash',
      });
    });
    carsByTowerKey.set(key, list);

    const workerSet = workersByTowerKey.get(key) ?? new Set<string>();
    (session.workerNames ?? []).forEach(name => workerSet.add(name));
    workersByTowerKey.set(key, workerSet);
  });

  // A car counts as unavailable either via this board's own toggle, or because
  // it was auto-marked 'skipped' at session-build time (customer's skip date).
  const isUnavailable = (c: CarListItem) => c.unavailable || c.status === 'skipped';

  const urgencyOrder: Record<CarUrgency, number> = { overdue: 0, 'due-soon': 1, later: 2, done: 3 };

  // Sort: available cars first (by urgency), then unavailable
  carsByTowerKey.forEach((cars, key) => {
    const available = cars
      .filter(c => !isUnavailable(c))
      .sort((a, b) => {
        const ua = getCarUrgency(a.preferredTime, a.status as CleaningSessionCar['status']);
        const ub = getCarUrgency(b.preferredTime, b.status as CleaningSessionCar['status']);
        return urgencyOrder[ua] - urgencyOrder[ub];
      });
    const unavailable = cars.filter(isUnavailable);
    carsByTowerKey.set(key, [...available, ...unavailable]);
  });

  async function toggleUnavailable(car: CarListItem) {
    if (toggling) return;
    setToggling(`${car.sessionId}-${car.carIndex}`);

    try {
      const sessionRef = doc(db, 'cleaningSessions', car.sessionId);
      await runTransaction(db, async tx => {
        const snap = await tx.get(sessionRef);
        if (!snap.exists()) return;
        const currentCars = (snap.data().cars ?? []) as Record<string, unknown>[];
        const newCars = currentCars.map((c, idx) =>
          idx === car.carIndex ? { ...c, unavailable: !car.unavailable } : c
        );
        tx.update(sessionRef, { cars: newCars });
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
      let record: Record<string, unknown> | undefined;
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
      record = recordsSnap.docs.find(d => (d.data() as any).tower === car.tower)?.data() as Record<string, unknown>
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
          Today&rsquo;s cars grouped by tower. Mark unavailable to move to bottom.
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

      {/* Lists — one per tower, to-do-style checklist inside each */}
      {loading ? (
        <Card style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
          Loading…
        </Card>
      ) : (
        towerGroups.length === 0 ? (
          <Card style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            No cars scheduled for today. Start a cleaning session from the Schedule page.
          </Card>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
          {towerGroups.map(group => {
            const cars = carsByTowerKey.get(group.key) ?? [];
            const workerNames = Array.from(workersByTowerKey.get(group.key) ?? []);

            return (
              <div key={group.key} style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 12, overflow: 'hidden' }}>
                {/* List header — name + open count, like a to-do "list" row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Icon name="list-checks" size={16} color="var(--pc-fg-3)" />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>
                        {group.tower}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: '1px 0 0' }}>
                        {group.societyName}{workerNames.length > 0 ? ` · ${workerNames.join(', ')}` : ''}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
                    {group.openCars}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid var(--pc-line)', padding: '6px 4px 6px 16px' }}>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Sorted by urgency
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
                      const urgency = getCarUrgency(car.preferredTime, car.status as CleaningSessionCar['status']);
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
                            onClick={() => !isDone && !unavailable && markDone(car)}
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
                            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-fg-3)', margin: '2px 0 0', letterSpacing: '0.02em' }}>
                              CAR {car.carPlate}{car.parkingNumber ? ` · PARKING ${car.parkingNumber}` : ''}
                              {(car.carMake || car.carModel) ? ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}` : ''}
                            </p>
                            {!isDone && !unavailable && urgency !== 'later' && (
                              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, fontWeight: 600, color: URGENCY_COLOR[urgency], margin: '3px 0 0' }}>
                                {URGENCY_LABEL[urgency]} · {formatSlot(car.preferredTime)}
                              </p>
                            )}
                            {!isDone && !unavailable && urgency === 'later' && (
                              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
                                {formatSlot(car.preferredTime)}
                              </p>
                            )}
                            {unavailable && (
                              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-3)', margin: '3px 0 0' }}>
                                {car.status === 'skipped' ? 'Not available today' : 'Marked unavailable'}
                              </p>
                            )}
                          </div>

                          {/* Unavailable toggle — hidden for auto-skipped cars, since that
                              comes from the customer's own skip date, not this toggle */}
                          {car.status !== 'skipped' && (
                            <button
                              type="button"
                              onClick={() => toggleUnavailable(car)}
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
          })}
        </div>
        )
      )}
    </div>
  );
}
