'use client';
import { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Booking } from '@pc/firebase';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

type LiveBooking = Booking & { id: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function monthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleString('en-IN', { month: 'short' });
}

function getMonth(ts: any): { m: number; y: number } {
  if (!ts) return { m: -1, y: -1 };
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return { m: d.getMonth(), y: d.getFullYear() };
}

// Compute bar chart SVG points from an array of values (normalized to 0-220px height)
function sparkPoints(values: number[], w = 800, h = 220): string {
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => `${Math.round((i / (values.length - 1)) * w)},${Math.round(h - (v / max) * h)}`)
    .join(' ');
}

function sparkFill(points: string, w = 800, h = 220): string {
  return `0,${h} ${points} ${w},${h}`;
}

// Compute donut arc segments for an SVG circle
function donutSegments(counts: { label: string; value: number; color: string }[], r = 56) {
  const total = counts.reduce((s, c) => s + c.value, 0) || 1;
  const circumference = 2 * Math.PI * r;
  let offset = circumference * 0.25; // start at top
  return counts.map(c => {
    const dash = (c.value / total) * circumference;
    const seg = { ...c, pct: Math.round((c.value / total) * 100), dash, offset };
    offset += dash;
    return seg;
  });
}

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState('30D');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'bookings'), limit(1000)),
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))); setLoading(false); },
      err  => { console.warn('[Analytics]', err.message); setLoading(false); },
    );
  }, []);

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const doneBookings = bookings.filter(b => b.status === 'done');
  const totalRevenue = doneBookings.reduce((s, b) => s + (b.priceBreakdown?.total ?? 0), 0);
  const jobsDone     = doneBookings.length;
  const avgJobValue  = jobsDone > 0 ? Math.round(totalRevenue / jobsDone) : 0;
  const cancelCount  = bookings.filter(b => b.status === 'cancelled').length;

  // Monthly revenue — last 12 months
  const monthly: number[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const targetM = d.getMonth();
    const targetY = d.getFullYear();
    return doneBookings
      .filter(b => { const { m, y } = getMonth((b as any).scheduledAt); return m === targetM && y === targetY; })
      .reduce((s, b) => s + (b.priceBreakdown?.total ?? 0), 0);
  });

  const monthLabels = Array.from({ length: 12 }, (_, i) => monthLabel(11 - i));

  // Job mix by first service ID
  const svcCounts: Record<string, number> = {};
  bookings.forEach(b => {
    const svc = b.serviceIds?.[0] ?? 'other';
    svcCounts[svc] = (svcCounts[svc] ?? 0) + 1;
  });

  const jobMix = Object.entries(svcCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([svc, count], i) => ({
      label: svc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: count,
      color: ['var(--pc-sage)', 'var(--pc-sage-hi)', 'var(--pc-info)', 'var(--pc-warning)', 'var(--pc-fg-4)'][i],
    }));

  const jobMixSegments = donutSegments(jobMix);

  // Top services by revenue
  const svcRevenue: Record<string, { jobs: number; revenue: number }> = {};
  doneBookings.forEach(b => {
    const svc = b.serviceIds?.[0] ?? 'other';
    if (!svcRevenue[svc]) svcRevenue[svc] = { jobs: 0, revenue: 0 };
    svcRevenue[svc].jobs    += 1;
    svcRevenue[svc].revenue += b.priceBreakdown?.total ?? 0;
  });

  const topServices = Object.entries(svcRevenue)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([svc, { jobs, revenue }]) => ({
      service: svc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      jobs,
      revenue,
      avg: jobs > 0 ? Math.round(revenue / jobs) : 0,
    }));

  const kpis = [
    { label: 'Total Revenue',    value: `₹${totalRevenue.toLocaleString('en-IN')}`, delta: 'completed jobs only',  icon: 'trending-up',  positive: true  },
    { label: 'Jobs Completed',   value: jobsDone.toLocaleString(),                  delta: 'of all bookings',     icon: 'check-circle', positive: true  },
    { label: 'Avg Job Value',    value: `₹${avgJobValue.toLocaleString('en-IN')}`,  delta: 'per completed job',   icon: 'bar-chart-2',  positive: true  },
    { label: 'Cancellations',    value: cancelCount.toLocaleString(),               delta: 'total cancelled',     icon: 'x-circle',     positive: false },
  ];

  const pts  = monthly.length > 1 ? sparkPoints(monthly) : '';
  const fill = monthly.length > 1 ? sparkFill(pts) : '';

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>ANALYTICS</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Performance Overview</h1>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--pc-card-hi)', padding: 4, borderRadius: 8 }}>
          {['7D', '30D', '90D', 'All'].map(r => (
            <button type="button" key={r} onClick={() => setRange(r)} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: range === r ? 'var(--pc-ink-raised)' : 'transparent',
              color:      range === r ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map(({ label, value, delta, icon, positive }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{loading ? '—' : value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: positive ? 'var(--pc-sage)' : 'var(--pc-fg-3)', margin: 0 }}>{delta}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

        {/* Revenue over time */}
        <Card>
          <Eyebrow style={{ marginBottom: 16, display: 'block' }}>REVENUE OVER TIME — LAST 12 MONTHS</Eyebrow>
          <div style={{ height: 240, position: 'relative' }}>
            <svg aria-hidden="true" viewBox="0 0 800 220" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {[0, 55, 110, 165].map(y => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--pc-line)" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              {pts && (
                <>
                  <polygon points={fill} fill="var(--pc-sage)" opacity="0.1" />
                  <polyline points={pts} fill="none" stroke="var(--pc-sage)" strokeWidth="2" />
                  {monthly.map((v, i) => {
                    const max = Math.max(...monthly, 1);
                    const x = Math.round((i / 11) * 800);
                    const y = Math.round(220 - (v / max) * 220);
                    return v > 0 ? <circle key={i} cx={x} cy={y} r={3} fill="var(--pc-sage)" /> : null;
                  })}
                </>
              )}
              {!pts && !loading && (
                <text x="400" y="110" textAnchor="middle" fill="var(--pc-fg-4)" fontSize="14" fontFamily="sans-serif">No completed bookings yet</text>
              )}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {monthLabels.map((m, i) => (
              <span key={i} style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)' }}>{m}</span>
            ))}
          </div>
        </Card>

        {/* Job mix donut */}
        <Card>
          <Eyebrow style={{ marginBottom: 20, display: 'block' }}>JOB MIX</Eyebrow>
          {loading ? (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</p>
          ) : jobMix.length === 0 ? (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No bookings yet.</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <svg aria-hidden="true" width="140" height="140" viewBox="0 0 140 140">
                  {jobMixSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="70" cy="70" r="56"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={`${seg.dash} ${2 * Math.PI * 56 - seg.dash}`}
                      strokeDashoffset={-seg.offset + 2 * Math.PI * 56 * 0.25}
                    />
                  ))}
                </svg>
              </div>
              {jobMixSegments.map(seg => (
                <div key={seg.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: seg.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{seg.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 600 }}>{seg.pct}%</span>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>

      {/* Top services by revenue */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>TOP SERVICES BY REVENUE</Eyebrow>
        </div>
        {loading ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>Loading…</p>
        ) : topServices.length === 0 ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>No completed bookings yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Service', 'Jobs', 'Revenue', 'Avg Value', 'Share'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topServices.map((row, i) => {
                const share = totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0;
                return (
                  <tr key={row.service} style={{ borderBottom: i < topServices.length - 1 ? '1px solid var(--pc-line)' : 'none' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>{row.service}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{row.jobs}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>
                      ₹{row.revenue.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>
                      ₹{row.avg.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--pc-line-strong)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${share}%`, background: 'var(--pc-sage)', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', minWidth: 30 }}>{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
