'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Booking, Worker, BookingStatus } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type LiveBooking = Booking & { id: string };
type LiveWorker  = Worker  & { id: string };

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending:    'Pending',
  assigned:   'Assigned',
  enroute:    'En Route',
  inprogress: 'In Progress',
  done:       'Done',
  cancelled:  'Cancelled',
};

function formatTime(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [workers,  setWorkers]  = useState<LiveWorker[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, snap => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking)));
      setLoading(false);
    }, err => { console.warn('[Dashboard] bookings:', err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'workers'), snap => {
      setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker)));
    });
  }, []);

  const revenue   = bookings
    .filter(b => b.status === 'done')
    .reduce((s, b) => s + (b.priceBreakdown?.total ?? 0), 0);
  const activeJobs    = bookings.filter(b => ['inprogress', 'enroute'].includes(b.status)).length;
  const workersOnline = workers.filter(w => w.isOnline).length;
  const topWorkers    = [...workers].sort((a, b) => (b.totalJobs ?? 0) - (a.totalJobs ?? 0)).slice(0, 4);
  const recentBookings= bookings.slice(0, 5);

  const kpis = [
    { label: 'Revenue (All)',   value: loading ? '—' : `₹${revenue.toLocaleString('en-IN')}`,       delta: 'completed jobs',  icon: 'trending-up',  positive: true  },
    { label: 'Active Jobs',     value: loading ? '—' : String(activeJobs),                          delta: 'en route / active', icon: 'activity',   positive: true  },
    { label: 'Workers Online',  value: loading ? '—' : String(workersOnline),                       delta: `of ${workers.length} total`, icon: 'users', positive: true },
    { label: 'Total Bookings',  value: loading ? '—' : String(bookings.length),                     delta: 'last 50',         icon: 'calendar',     positive: true  },
  ];

  return (
    <div style={{ padding: 'var(--pc-space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)' }}>

      {/* Page title */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-1)' }}>OVERVIEW</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)', fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Dashboard</h1>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--pc-space-3)' }}>
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
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: positive ? 'var(--pc-sage)' : 'var(--pc-danger)' }}>
                  {delta}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--pc-space-3)' }}>

        {/* Revenue chart (static sparkline — real chart needs charting library) */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--pc-space-5) var(--pc-space-5) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Eyebrow>BOOKING VOLUME — RECENT</Eyebrow>
          </div>
          <svg aria-hidden="true" viewBox="0 0 800 320" width="100%" height="320" style={{ display: 'block' }}>
            <g style={{ stroke: 'var(--pc-line-faint)' }} fill="none">
              <path d="M-20 100 Q200 80 400 110 T820 100" strokeWidth="20" />
              <path d="M-20 220 Q200 200 400 230 T820 220" strokeWidth="14" />
              <path d="M120 -20 Q140 160 100 340" strokeWidth="16" />
            </g>
            {[80, 160, 240].map(y => (
              <line key={y} x1="40" y1={y} x2="780" y2={y} style={{ stroke: 'var(--pc-line)' }} strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            <polygon
              points="40,320 40,280 110,240 180,260 250,180 320,220 390,150 460,190 530,120 600,160 670,90 740,110 780,80 780,320"
              fill="var(--pc-sage)" opacity="0.08"
            />
            <polyline
              points="40,280 110,240 180,260 250,180 320,220 390,150 460,190 530,120 600,160 670,90 740,110 780,80"
              fill="none" stroke="var(--pc-sage)" strokeWidth="2"
            />
          </svg>
        </Card>

        {/* Worker utilisation — live */}
        <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          <Eyebrow>TOP WORKERS · JOBS</Eyebrow>
          {topWorkers.length === 0 ? (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              {loading ? 'Loading…' : 'No workers yet.'}
            </p>
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

      {/* Recent bookings — live */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--pc-space-4) var(--pc-space-5)', borderBottom: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>RECENT BOOKINGS</Eyebrow>
        </div>
        {loading ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>Loading…</p>
        ) : recentBookings.length === 0 ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>No bookings yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Ref', 'Customer', 'Service', 'Time', 'Worker', 'Status'].map(h => (
                  <th key={h} style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)' }}>
                    #{b.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)' }}>
                    {(b as any).customerName ?? b.customerId.slice(0, 10)}
                  </td>
                  <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>
                    {b.serviceIds?.[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—'}
                  </td>
                  <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>
                    {formatTime((b as any).scheduledAt)}
                  </td>
                  <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>
                    {(b as any).workerName ?? 'Unassigned'}
                  </td>
                  <td style={{ padding: 'var(--pc-space-3) var(--pc-space-5)' }}>
                    <StatusPill status={STATUS_LABEL[b.status] ?? b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Top workers table — live */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: 'var(--pc-space-4) var(--pc-space-5)', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>TOP PERFORMERS</Eyebrow>
        </div>
        {topWorkers.map((w, i) => (
          <div key={w.id} style={{
            padding: 'var(--pc-space-4) var(--pc-space-5)',
            borderBottom: i < topWorkers.length - 1 ? '1px solid var(--pc-line)' : 'none',
            display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)',
          }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-4)', minWidth: 24 }}>
              0{i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 var(--pc-space-1)' }}>{w.name}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', margin: 0 }}>
                {w.totalJobs ?? 0} jobs · ★ {w.rating?.toFixed(2) ?? '—'}
              </p>
            </div>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg)' }}>
              {w.earnings?.week ? `₹${w.earnings.week.toLocaleString('en-IN')}` : '—'}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
