'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningSessionEnhanced } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import CalendarMonth from '@/components/ui/CalendarMonth';

interface SessionRow extends CleaningSessionEnhanced { id: string }

function toDate(ts: Timestamp | Date | null | undefined): Date | null {
  if (!ts) return null;
  return ts instanceof Timestamp ? ts.toDate() : new Date(ts);
}

function dateKey(d: Date): string {
  return d.toDateString();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatSelectedDate(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function WorkerCalendarPage() {
  const { user } = useWorkerAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // No status/date filter here (unlike the dashboard's "today" listener) —
  // this page needs the worker's full session history to browse both
  // forward and backward through the calendar.
  useEffect(() => {
    if (!user) return;
    const live = new Map<string, SessionRow>();
    const onResult = (snap: { docs: { id: string; data(): unknown }[] }) => {
      snap.docs.forEach(d => live.set(d.id, { id: d.id, ...(d.data() as Record<string, unknown>) } as SessionRow));
      setSessions([...live.values()]); setLoading(false);
    };
    const current = onSnapshot(query(collection(db, 'cleaningSessions'), where('workerIds', 'array-contains', user.uid)), onResult, err => { console.warn('[WorkerCalendar] sessions listener:', err); setLoading(false); });
    const legacy = onSnapshot(query(collection(db, 'cleaningSessions'), where('workerId', '==', user.uid)), onResult, err => { console.warn('[WorkerCalendar] legacy sessions listener:', err); setLoading(false); });
    return () => { current(); legacy(); };
  }, [user]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      const d = toDate(s.scheduledDate as unknown as Timestamp);
      if (!d) continue;
      const key = dateKey(d);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [sessions]);

  const selectedSessions = (sessionsByDate.get(dateKey(selectedDate)) ?? [])
    .sort((a, b) => (toDate(a.scheduledDate as unknown as Timestamp)?.getTime() ?? 0) - (toDate(b.scheduledDate as unknown as Timestamp)?.getTime() ?? 0));

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'var(--pc-space-3)' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>SCHEDULE</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
          Calendar
        </h1>
      </div>

      <CalendarMonth
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        renderBadge={date => {
          const count = sessionsByDate.get(dateKey(date))?.length ?? 0;
          if (count === 0) return null;
          return (
            <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pc-sage)', display: 'inline-block' }} />
          );
        }}
      />

      {/* Selected day's sessions */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 10 }}>
          {formatSelectedDate(selectedDate).toUpperCase()}
          {selectedSessions.length > 0 ? ` · ${selectedSessions.length} SESSION${selectedSessions.length === 1 ? '' : 'S'}` : ''}
        </Eyebrow>

        {loading ? (
          <Card style={{ padding: 'var(--pc-space-6)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>Loading…</p>
          </Card>
        ) : selectedSessions.length === 0 ? (
          <Card style={{ padding: 'var(--pc-space-6)', textAlign: 'center' }}>
            <Icon name="calendar" size={28} color="var(--pc-fg-4)" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              No cleaning scheduled for this date.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Summary only — no drill-in page. The per-car checklist for what's
                actually actionable (overdue / today / tomorrow) lives on the
                dashboard itself; a session outside that window has nothing to
                action here, so these rows are informational, not links. */}
            {selectedSessions.map(s => (
              <Card key={s.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: s.status === 'done' ? 'var(--pc-card-hi)' : 'var(--pc-sage)',
                  border: s.status === 'done' ? '1px solid var(--pc-line)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="building-2" size={16} color={s.status === 'done' ? 'var(--pc-fg-3)' : 'var(--pc-sage-ink)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                    {s.societyName}{s.tower ? ` · ${s.tower}` : ''}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {s.status === 'inprogress' ? 'In progress' : s.status === 'done' ? 'Done' : s.status === 'missed' ? 'Missed' : 'Scheduled'}
                  </p>
                </div>
                <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
                  {s.completedCars}/{s.totalCars} done
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
