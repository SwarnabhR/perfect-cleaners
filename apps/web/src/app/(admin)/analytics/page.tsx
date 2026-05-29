'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Booking } from '@pc/firebase';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

type LiveBooking = Booking & { id: string };
type RangeKey = '7D' | '30D' | '90D' | 'All';

function toDate(ts: any): Date | null {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}
function rangeStart(r: RangeKey): Date | null {
  if (r === 'All') return null;
  const d = new Date();
  if (r === '7D')  d.setDate(d.getDate() - 7);
  if (r === '30D') d.setDate(d.getDate() - 30);
  if (r === '90D') d.setDate(d.getDate() - 90);
  return d;
}
type BucketConfig = { labels: string[]; bucket: (d: Date) => number };
function bucketConfig(r: RangeKey): BucketConfig {
  const now = new Date();
  if (r === '7D') {
    const labels = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleString('en-IN', { weekday: 'short' }); });
    return { labels, bucket: (d: Date) => { const diff = Math.floor((now.getTime() - d.getTime()) / 86400000); const b = 6 - diff; return b >= 0 && b < 7 ? b : -1; } };
  }
  if (r === '30D') {
    const labels = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (25 - i * 5)); return d.toLocaleString('en-IN', { month: 'short', day: 'numeric' }); });
    return { labels, bucket: (d: Date) => { const diff = Math.floor((now.getTime() - d.getTime()) / 86400000); const b = 5 - Math.floor(diff / 5); return b >= 0 && b < 6 ? b : -1; } };
  }
  if (r === '90D') {
    const labels = Array.from({ length: 9 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (80 - i * 10)); return d.toLocaleString('en-IN', { month: 'short', day: 'numeric' }); });
    return { labels, bucket: (d: Date) => { const diff = Math.floor((now.getTime() - d.getTime()) / 86400000); const b = 8 - Math.floor(diff / 10); return b >= 0 && b < 9 ? b : -1; } };
  }
  const labels = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (11 - i)); return d.toLocaleString('en-IN', { month: 'short' }); });
  return { labels, bucket: (d: Date) => { for (let i = 0; i < 12; i++) { const ref = new Date(); ref.setMonth(ref.getMonth() - (11 - i)); if (d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()) return i; } return -1; } };
}
function sparkPoints(values: number[], w = 800, h = 220): string {
  const max = Math.max(...values, 1);
  return values.map((v, i) => `${Math.round((i / (values.length - 1)) * w)},${Math.round(h - (v / max) * h)}`).join(' ');
}
function sparkFill(points: string, w = 800, h = 220): string { return `0,${h} ${points} ${w},${h}`; }
function donutSegments(counts: { label: string; value: number; color: string }[], r = 56) {
  const total = counts.reduce((s, c) => s + c.value, 0) || 1;
  const circumference = 2 * Math.PI * r;
  let offset = circumference * 0.25;
  return counts.map(c => { const dash = (c.value / total) * circumference; const seg = { ...c, pct: Math.round((c.value / total) * 100), dash, offset }; offset += dash; return seg; });
}

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState<RangeKey>('30D');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'bookings'), limit(1000)),
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))); setLoading(false); },
      err  => { console.warn('[Analytics]', err.message); setLoading(false); },
    );
  }, []);

  const filtered = useMemo(() => {
    const cutoff = rangeStart(range);
    if (!cutoff) return bookings;
    return bookings.filter(b => { const ts = (b as any).scheduledAt ?? (b as any).createdAt; const d = toDate(ts); return d ? d >= cutoff : false; });
  }, [bookings, range]);

  const doneBookings = filtered.filter(b => b.status === 'done');
  const totalRevenue = doneBookings.reduce((s, b) => s + (b.priceBreakdown?.total ?? 0), 0);
  const jobsDone     = doneBookings.length;
  const avgJobValue  = jobsDone > 0 ? Math.round(totalRevenue / jobsDone) : 0;
  const cancelCount  = filtered.filter(b => b.status === 'cancelled').length;

  const { labels: bucketLabels, bucket } = useMemo(() => bucketConfig(range), [range]);
  const bucketRevenue = useMemo(() => {
    const arr = new Array(bucketLabels.length).fill(0);
    doneBookings.forEach(b => { const ts = (b as any).scheduledAt ?? (b as any).createdAt; const d = toDate(ts); if (!d) return; const idx = bucket(d); if (idx >= 0) arr[idx] += b.priceBreakdown?.total ?? 0; });
    return arr;
  }, [doneBookings, bucket, bucketLabels.length]);

  const svcCounts: Record<string, number> = {};
  filtered.forEach(b => { const svc = b.serviceIds?.[0] ?? 'other'; svcCounts[svc] = (svcCounts[svc] ?? 0) + 1; });
  const jobMix = Object.entries(svcCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([svc, count], i) => ({ label: svc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: count, color: ['var(--pc-sage)', 'var(--pc-sage-hi)', 'var(--pc-info)', 'var(--pc-warning)', 'var(--pc-fg-4)'][i] }));
  const jobMixSegments = donutSegments(jobMix);

  const svcRevenue: Record<string, { jobs: number; revenue: number }> = {};
  doneBookings.forEach(b => { const svc = b.serviceIds?.[0] ?? 'other'; if (!svcRevenue[svc]) svcRevenue[svc] = { jobs: 0, revenue: 0 }; svcRevenue[svc].jobs += 1; svcRevenue[svc].revenue += b.priceBreakdown?.total ?? 0; });
  const topServices = Object.entries(svcRevenue).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
    .map(([svc, { jobs, revenue }]) => ({ service: svc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), jobs, revenue, avg: jobs > 0 ? Math.round(revenue / jobs) : 0 }));

  const kpis = [
    { label: 'Total Revenue',  value: `₹${totalRevenue.toLocaleString('en-IN')}`, delta: 'completed jobs only', icon: 'trending-up',  positive: true  },
    { label: 'Jobs Completed', value: jobsDone.toLocaleString(),                   delta: 'of filtered period',  icon: 'check-circle', positive: true  },
    { label: 'Avg Job Value',  value: `₹${avgJobValue.toLocaleString('en-IN')}`,  delta: 'per completed job',   icon: 'bar-chart-2',  positive: true  },
    { label: 'Cancellations',  value: cancelCount.toLocaleString(),                delta: 'total cancelled',      icon: 'x-circle',     positive: false },
  ];

  const pts  = bucketRevenue.length > 1 ? sparkPoints(bucketRevenue) : '';
  const fill = pts ? sparkFill(pts) : '';
  const rangeLabel: Record<RangeKey, string> = { '7D': 'LAST 7 DAYS', '30D': 'LAST 30 DAYS', '90D': 'LAST 90 DAYS', 'All': 'ALL TIME' };

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>ANALYTICS</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Performance Overview</h1>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--pc-card-hi)', padding: 4, borderRadius: 8, flexShrink: 0 }}>
          {(['7D', '30D', '90D', 'All'] as RangeKey[]).map(r => (
            <button type="button" key={r} onClick={() => setRange(r)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: range === r ? 'var(--pc-ink-raised)' : 'transparent', color: range === r ? 'var(--pc-fg)' : 'var(--pc-fg-3)', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, transition: 'background 150ms, color 150ms', minHeight: 36 }}>{r}</button>
          ))}
        </div>
      </div>

      <div className="kpi-grid-4">
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

      <div className="charts-row-2-1">
        <Card>
          <Eyebrow style={{ marginBottom: 16, display: 'block' }}>REVENUE — {rangeLabel[range]}</Eyebrow>
          <div style={{ height: 240, position: 'relative' }}>
            <svg aria-hidden="true" viewBox="0 0 800 220" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {[0, 55, 110, 165].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--pc-line)" strokeWidth="1" strokeDasharray="4 4" />)}
              {pts && (<>
                <polygon points={fill} fill="var(--pc-sage)" opacity="0.1" />
                <polyline points={pts} fill="none" stroke="var(--pc-sage)" strokeWidth="2" />
                {bucketRevenue.map((v, i) => { const max = Math.max(...bucketRevenue, 1); const x = Math.round((i / (bucketRevenue.length - 1)) * 800); const y = Math.round(220 - (v / max) * 220); return v > 0 ? <circle key={i} cx={x} cy={y} r={3} fill="var(--pc-sage)" /> : null; })}
              </>)}
              {!pts && !loading && <text x="400" y="110" textAnchor="middle" fill="var(--pc-fg-4)" fontSize="14" fontFamily="sans-serif">No completed bookings in this period</text>}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, overflowX: 'hidden' }}>
            {bucketLabels.map((m, i) => <span key={i} style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)' }}>{m}</span>)}
          </div>
        </Card>

        <Card>
          <Eyebrow style={{ marginBottom: 20, display: 'block' }}>JOB MIX</Eyebrow>
          {loading ? (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</p>
          ) : jobMix.length === 0 ? (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No bookings in this period.</p>
          ) : (<>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <svg aria-hidden="true" width="140" height="140" viewBox="0 0 140 140">
                {jobMixSegments.map((seg, i) => <circle key={i} cx="70" cy="70" r="56" fill="transparent" stroke={seg.color} strokeWidth="18" strokeDasharray={`${seg.dash} ${2 * Math.PI * 56 - seg.dash}`} strokeDashoffset={-seg.offset + 2 * Math.PI * 56 * 0.25} />)}
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
          </>)}
        </Card>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>TOP SERVICES — {rangeLabel[range]}</Eyebrow>
        </div>
        {loading ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>Loading…</p>
        ) : topServices.length === 0 ? (
          <p style={{ padding: 24, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>No completed bookings in this period.</p>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Service', 'Jobs', 'Revenue', 'Avg Value', 'Share'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topServices.map((row, i) => {
                  const share = totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0;
                  return (
                    <tr key={row.service} style={{ borderBottom: i < topServices.length - 1 ? '1px solid var(--pc-line)' : 'none' }}>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.service}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{row.jobs}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{row.revenue.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>₹{row.avg.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--pc-line-strong)', borderRadius: 999, overflow: 'hidden', minWidth: 60 }}>
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
          </div>
        )}
      </Card>
    </div>
  );
}
