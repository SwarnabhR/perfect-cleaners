'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningSessionEnhanced, CleaningSessionCar } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface CarWithSession extends CleaningSessionCar {
  sessionId: string;
  societyName: string;
  tower: string;
  sessionDate: Date;
}

const TIME_SLOTS = [7, 9, 14] as const;

function formatTime(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function getTimeSlotLabel(hour: number): string {
  const time = formatTime(hour);
  if (hour === 7) return `${time} (Morning)`;
  if (hour === 9) return `${time} (Mid-morning)`;
  if (hour === 14) return `${time} (Afternoon)`;
  return time;
}

interface CarListItem {
  sessionId: string;
  carIndex: number;
  customerId: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number;
  status: string;
  unavailable?: boolean;
  societyName: string;
  tower: string;
}

export default function LiveCleaningPage() {
  const [sessions, setSessions] = useState<(CleaningSessionEnhanced & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSociety, setFilterSociety] = useState('all');
  const [filterTower, setFilterTower] = useState('all');
  const [societies, setSocieties] = useState<Set<string>>(new Set());
  const [towers, setTowers] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, 'cleaningSessions'),
        where('status', 'in', ['scheduled', 'inprogress'])
      ),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CleaningSessionEnhanced & { id: string }));
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

  const carsBySlot = new Map<number, CarListItem[]>();
  TIME_SLOTS.forEach(slot => carsBySlot.set(slot, []));

  filteredSessions.forEach(session => {
    (session.cars ?? []).forEach((car, idx) => {
      const timeSlot = car.preferredTime ?? 7;
      if (!carsBySlot.has(timeSlot)) {
        carsBySlot.set(timeSlot, []);
      }
      carsBySlot.get(timeSlot)!.push({
        sessionId: session.id,
        carIndex: idx,
        customerId: car.customerId,
        carPlate: car.carPlate,
        carMake: car.carMake,
        carModel: car.carModel,
        preferredTime: car.preferredTime,
        status: car.status,
        unavailable: Boolean((car as unknown as Record<string, unknown>)['unavailable']),
        societyName: session.societyName,
        tower: session.tower,
      });
    });
  });

  TIME_SLOTS.forEach(slot => {
    const cars = carsBySlot.get(slot)!;
    const available = cars.filter(c => !c.unavailable);
    const unavailable = cars.filter(c => c.unavailable);
    carsBySlot.set(slot, [...available, ...unavailable]);
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

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
        <h1 className="admin-page-title">Live Cleaning Task Board</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
          Real-time car list grouped by time slots. Mark unavailable to move to bottom.
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

      {/* Time Slot Cards */}
      {loading ? (
        <Card style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
          Loading…
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          {TIME_SLOTS.map(slot => {
            const cars = carsBySlot.get(slot) ?? [];
            const availableCount = cars.filter(c => !c.unavailable).length;

            return (
              <Card key={slot} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Slot Header */}
                <div style={{ padding: 16, borderBottom: '1px solid var(--pc-line)', background: 'var(--pc-card-hi)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 4px', fontWeight: 600 }}>
                        {getTimeSlotLabel(slot)}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
                        {availableCount} / {cars.length} CARS
                      </p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="clock" size={18} color="var(--pc-info)" />
                    </div>
                  </div>
                </div>

                {/* Car List */}
                {cars.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>
                    No cars scheduled
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {cars.map((car, idx) => (
                      <div
                        key={`${car.sessionId}-${car.carIndex}`}
                        style={{
                          padding: 12,
                          borderTop: idx > 0 ? '1px solid var(--pc-line)' : 'none',
                          background: car.unavailable ? 'var(--pc-card-hi)' : 'transparent',
                          opacity: car.unavailable ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Car Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                              {car.carPlate}
                            </p>
                            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>
                              {car.carMake} {car.carModel}
                            </p>
                            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
                              {car.societyName} · {car.tower}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                background: car.status === 'done' ? 'var(--pc-sage)' : car.status === 'in_progress' ? 'var(--pc-warning)' : 'var(--pc-info)',
                                fontFamily: 'var(--pc-mono)',
                                fontSize: 9,
                                color: 'white',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                              }}
                            >
                              {car.status}
                            </div>

                            {/* Mark Unavailable Button */}
                            <button
                              type="button"
                              onClick={() => toggleUnavailable(car)}
                              disabled={toggling === `${car.sessionId}-${car.carIndex}`}
                              title={car.unavailable ? 'Mark available' : 'Mark unavailable'}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: car.unavailable ? '1px solid var(--pc-danger)' : '1px solid var(--pc-line)',
                                background: car.unavailable ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                cursor: toggling ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                opacity: toggling === `${car.sessionId}-${car.carIndex}` ? 0.6 : 1,
                              }}
                            >
                              <Icon
                                name={car.unavailable ? 'x' : 'check'}
                                size={14}
                                color={car.unavailable ? 'var(--pc-danger)' : 'var(--pc-fg-3)'}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
