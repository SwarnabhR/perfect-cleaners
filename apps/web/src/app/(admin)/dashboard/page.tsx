'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, where, getDocs } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Booking, Worker, BookingStatus } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type LiveBooking = Booking & { id: string };
type LiveWorker  = Worker  & { id: string };

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending', assigned: 'Assigned', enroute: 'En Route',
  arrived: 'Arrived', inprogress: 'In Progress', done: 'Done', cancelled: 'Cancelled',
};

type MaybeTimestamp = Timestamp | Date | null | undefined;

function toDate(ts: MaybeTimestamp): Date | null {
  if (!ts) return null;
  return ts instanceof Timestamp ? ts.toDate() : new Date(ts);
}

function formatTime(ts: MaybeTimestamp): string {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Build a 14-day sparkline from booking createdAt timestamps.
function buildSparkline(bookings: LiveBooking[], W = 800, H = 200): { line: string; fill: string; labels: string[] } {
  const DAYS = 14;
  const buckets = Array<number>(DAYS).fill(0);
  const now = Date.now();
  const dayMs = 86_400_000;
  for (const b of bookings) {
    const ts = b.createdAt as unknown as MaybeTimestamp;
    const t  = toDate(ts)?.getTime() ?? 0;
    const daysAgo = Math.floor((now - t) / dayMs);
    if (daysAgo >= 0 && daysAgo < DAYS) buckets[DAYS - 1 - daysAgo]++;
  }
  const max = Math.max(...buckets, 1);
  const pts = buckets.map((v, i) => {
    const x = Math.round((i / (DAYS - 1)) * W);
    const y = Math.round(H - (v / max) * H * 0.85 - H * 0.05);
    return `${x},${y}`;
  });
  return {
    line: pts.join(' '),
    fill: `0,${H} ${pts.join(' ')} ${W},${H}`,
    labels: buckets.map((_, i) => {
      const d = new Date(now - (DAYS - 1 - i) * dayMs);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }),
  };
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [workers,  setWorkers]  = useState<LiveWorker[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [activeMembers, setActiveMembers] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [societyRevenue, setSocietyRevenue] = useState(0);
  const [societyLoading, setSocietyLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q,
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))); setLoading(false); },
      err  => { console.warn('[Dashboard] bookings:', err.message); setLoading(false); },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'workers'),
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker))),
    );
  }, []);

  // Society KPIs — fetch once (not live, since they change infrequently)
  useEffect(() => {
    async function loadSocietyData() {
      try {
        const [membersSnap, approvalsSnap, sessionsSnap, incomeSnap] = await Promise.all([
          getDocs(query(collection(db, 'customerSocietyRecords'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'pendingApprovals'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'cleaningSessions'), where('scheduledDate', '>=', new Date()))),
          getDocs(query(collection(db, 'cleaningLogs'), where('billed', '==', true))),
        ]);
        setActiveMembers(membersSnap.size);
        setPendingApprovals(approvalsSnap.size);
        setTodaySessions(sessionsSnap.size);
        setSocietyRevenue(incomeSnap.docs.reduce((s, d) => s + ((d.data() as any).servicePrice ?? 0), 0));
      } catch (err) {
        console.warn('[Dashboard] society data:', err);
      } finally {
        setSocietyLoading(false);
      }
    }
    loadSocietyData();
  }, []);

  const spark          = buildSparkline(bookings);
  const revenue        = bookings.filter(b => b.status === 'done').reduce((s, b) => s + (b.priceBreakdown?.total ?? 0), 0);
  const activeJobs     = bookings.filter(b => ['enroute', 'arrived', 'inprogress'].includes(b.status)).length;
  const workersOnline  = workers.filter(w => w.isOnline).length;
  const topWorkers     = [...workers].sort((a, b) => (b.totalJobs ?? 0) - (a.totalJobs ?? 0)).slice(0, 4);
  const recentBookings = bookings.slice(0, 5);

  const kpis = [
    { label: 'Revenue (All)',  value: loading ? '—' : `₹${revenue.toLocaleString('en-IN')}`,  delta: 'completed jobs',        icon: 'trending-up',  positive: true  },
    { label: 'Active Jobs',    value: loading ? '—' : String(activeJobs),                      delta: 'en route / active',     icon: 'activity',     positive: true  },
    { label: 'Workers Online', value: loading ? '—' : String(workersOnline),                   delta: `of ${workers.length} total`, icon: 'users',   positive: true  },
    { label: 'Total Bookings', value: loading ? '—' : String(bookings.length),                 delta: 'last 50',               icon: 'calendar',     positive: true  },
  ];

  const societyKpis = [
    { label: 'Society Members', value: societyLoading ? '—' : String(activeMembers),  delta: 'active enrollments',     icon: 'users',       positive: true  },
    { label: 'Pending Approvals', value: societyLoading ? '—' : String(pendingApprovals), delta: 'awaiting review',       icon: 'clock',       positive: pendingApprovals === 0 },
    { label: 'Upcoming Sessions', value: societyLoading ? '—' : String(todaySessions),  delta: 'scheduled',              icon: 'calendar',    positive: true  },
    { label: 'Society Income',    value: societyLoading ? '—' : `₹${societyRevenue.toLocaleString('en-IN')}`, delta: 'billed cleans', icon: 'trending-up', positive: true  },
  ];

  return (
    <div className="admin-page-root">

      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-1)' }}>OVERVIEW</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)', fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Dashboard</h1>
      </div>

      {/* KPI cards — individual bookings */}
      <div className="kpi-grid-4">
        {kpis.map(({ label, value, delta, icon, positive }) => (
          <Card key={label} style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)', margin: 0 }}>{label}</p>
              <Icon name={icon} size={14} color="var(--pc-fg-4)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)', color: 'var(--pc-fg)', margin: '0 0 var(--pc-space-1)' }}>{value}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)' }}>
                <Icon name={positive ? 'arrow-up-right' : 'arrow-down-right'} size={12} color={positive ? 'var(--pc-sage)' : 'var(--pc-danger)'} />
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: positive ? 'var(--pc-sage)' : 'var(--pc-danger)' }}>{delta}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* KPI cards — society programme */}
      <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 10 }}>
        SOCIETY PROGRAMME
      </div>
      <div className="kpi-grid-4">
        {societyKpis.map(({ label, value, delta, icon, positive }) => (
          <Card key={label} style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)', margin: 0 }}>{label}</p>
              <Icon name={icon} size={14} color="var(--pc-fg-4)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)', color: 'var(--pc-fg)', margin: '0 0 var(--pc-space-1)' }}>{value}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)' }}>
                <Icon name={positive ? 'arrow-up-right' : 'arrow-down-right'} size={12} color={positive ? 'var(--pc-sage)' : 'var(--pc-danger)'} />
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: positive ? 'var(--pc-sage)' : 'var(--pc-danger)' }}>{delta}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row-1-4-1">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--pc-space-5) var(--pc-space-5) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Eyebrow>BOOKING VOLUME — 14 DAYS</Eyebrow>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', letterSpacing: '0.06em' }}>
              {loading ? '—' : `${bookings.length} bookings`}
            </span>
          </div>
          <svg aria-hidden="true" viewBox="0 0 800 200" width="100%" height="160" style={{ display: 'block', marginTop: 8 }}>
            {[50, 100, 150].map(y => (
              <line key={y} x1="0" y1={y} x2="800" y2={y} style={{ stroke: 'var(--pc-line)' }} strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {!loading && (
              <>
                <polygon points={spark.fill} fill="var(--pc-sage)" opacity="0.10" />
                <polyline points={spark.line} fill="none" stroke="var(--pc-sage)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </>
            )}
          </svg>
          {!loading && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 var(--pc-space-3) var(--pc-space-3)' }}>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', letterSpacing: '0.04em' }}>
                {spark.labels[0]}
              </span>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', letterSpacing: '0.04em' }}>
                Today
              </span>
            </div>
          )}
        </Card>

        <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          <Eyebrow>TOP WORKERS · JOBS</Eyebrow>
          {topWorkers.length === 0 ? (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>{loading ? 'Loading…' : 'No workers yet.'}</p>
          ) : topWorkers.map(w => (
            <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)' }}>{w.name}</span>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)' }}>{w.totalJobs ?? 0} jobs</span>
              </div>
              <div style={{ height: 4, background: 'var(--pc-line-strong)', borderRadius: 'var(--pc-radius-pill)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(((w.totalJobs ?? 0) / Math.max(topWorkers[0]?.totalJobs ?? 1, 1)) * 100, 100)}%`, background: 'var(--pc-sage)', borderRadius: 'var(--pc-radius-pill)' }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent bookings */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--pc-space-4) var(--pc-space-5)', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>RECENT BOOKINGS</Eyebrow>
        </div>
        {loading ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>Loading…</p>
        ) : recentBookings.length === 0 ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>No bookings yet.</p>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Ref', 'Customer', 'Service', 'Time', 'Worker', 'Status'].map(h => (
                    <th key={h} style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', whiteSpace: 'nowrap' }}>#{b.id.slice(0, 8).toUpperCase()}</td>
                    <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', whiteSpace: 'nowrap' }}>{b.customerName ?? b.customerId.slice(0, 10)}</td>
                    <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{b.serviceIds?.[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—'}</td>
                    <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{formatTime(b.scheduledAt as unknown as MaybeTimestamp)}</td>
                    <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{b.workerName ?? 'Unassigned'}</td>
                    <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)' }}><StatusPill status={STATUS_LABEL[b.status] ?? b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top performers */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: 'var(--pc-space-4) var(--pc-space-5)', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>TOP PERFORMERS</Eyebrow>
        </div>
        {topWorkers.map((w, i) => (
          <div key={w.id} style={{ padding: 'var(--pc-space-4) var(--pc-space-5)', borderBottom: i < topWorkers.length - 1 ? '1px solid var(--pc-line)' : 'none', display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)' }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-4)', minWidth: 24 }}>0{i + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 var(--pc-space-1)' }}>{w.name}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', margin: 0 }}>{w.totalJobs ?? 0} jobs · ★ {w.rating?.toFixed(2) ?? '—'}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
