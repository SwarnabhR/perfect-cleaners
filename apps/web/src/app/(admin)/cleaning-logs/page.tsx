'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningLog } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';

type LiveLog = CleaningLog & { id: string };

interface WorkerSummary {
  workerId:   string;
  workerName: string;
  society:    string;
  count:      number;
  latest:     Date;
  logs:       LiveLog[];
}

function formatTime(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

export default function CleaningLogsPage() {
  const [logs,     setLogs]     = useState<LiveLog[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<WorkerSummary | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');

  useEffect(() => {
    const q = dateFilter === 'today'
      ? query(
          collection(db, 'cleaningLogs'),
          where('cleanedAt', '>=', todayStart()),
          orderBy('cleanedAt', 'desc'),
          limit(500),
        )
      : dateFilter === 'week'
        ? query(
            collection(db, 'cleaningLogs'),
            where('cleanedAt', '>=', Timestamp.fromDate(
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            )),
            orderBy('cleanedAt', 'desc'),
            limit(500),
          )
        : query(
            collection(db, 'cleaningLogs'),
            orderBy('cleanedAt', 'desc'),
            limit(200),
          );

    return onSnapshot(
      q,
      snap => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveLog)));
        setLoading(false);
      },
      err => { console.warn('[CleaningLogs]', err.message); setLoading(false); },
    );
  }, [dateFilter]);

  // Group by worker
  const byWorker = new Map<string, WorkerSummary>();
  for (const log of logs) {
    const key = log.workerId;
    if (!byWorker.has(key)) {
      byWorker.set(key, {
        workerId: log.workerId,
        workerName: log.workerName,
        society: log.societyName,
        count: 0,
        latest: new Date(0),
        logs: [],
      });
    }
    const s = byWorker.get(key)!;
    s.count += 1;
    s.logs.push(log);
    const t = (log.cleanedAt as any)?.toDate?.() ?? new Date(log.cleanedAt as any);
    if (t > s.latest) s.latest = t;
  }
  const workerSummaries = [...byWorker.values()].sort((a, b) => b.count - a.count);

  const kpis = {
    total:     logs.length,
    workers:   byWorker.size,
    societies: new Set(logs.map(l => l.societyId)).size,
    avgPerWorker: byWorker.size > 0
      ? Math.round(logs.length / byWorker.size)
      : 0,
  };

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
          <h1 className="admin-page-title">
            Cleaning Activity
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', 'week', 'all'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setDateFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: 999, border: '1px solid',
                borderColor: dateFilter === f ? 'var(--pc-sage)' : 'var(--pc-line)',
                background:  dateFilter === f ? 'var(--pc-sage)' : 'transparent',
                color:       dateFilter === f ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {[
          { label: 'Cars Cleaned',   value: loading ? '—' : kpis.total,                            icon: 'check-circle' },
          { label: 'Active Workers', value: loading ? '—' : kpis.workers,                          icon: 'hard-hat'     },
          { label: 'Societies',      value: loading ? '—' : kpis.societies,                        icon: 'building-2'   },
          { label: 'Avg per Worker', value: loading ? '—' : kpis.avgPerWorker,                     icon: 'trending-up'  },
        ].map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Per-worker summary table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>[WORKER BREAKDOWN]</Eyebrow>
          <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>
            Click a row to see individual logs
          </span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : workerSummaries.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            No cleaning activity{dateFilter === 'today' ? ' today' : dateFilter === 'week' ? ' this week' : ''} yet.
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Worker', 'Society', 'Cars Cleaned', 'Last Activity'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workerSummaries.map(ws => (
                  <tr
                    key={ws.workerId}
                    onClick={() => setSelected(selected?.workerId === ws.workerId ? null : ws)}
                    style={{ borderBottom: '1px solid var(--pc-line)', cursor: 'pointer', background: selected?.workerId === ws.workerId ? 'color-mix(in srgb, var(--pc-sage) 6%, transparent)' : 'transparent' }}
                  >
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={ws.workerName || '?'} size={32} />
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: 0, fontWeight: 500 }}>{ws.workerName}</p>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{ws.society}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, maxWidth: 120, height: 6, background: 'var(--pc-line)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--pc-sage)', borderRadius: 999, width: `${Math.min(100, (ws.count / Math.max(...workerSummaries.map(s => s.count))) * 100)}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)' }}>{ws.count}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                      {ws.latest.getTime() > 0
                        ? `${formatDate(ws.latest)} · ${ws.latest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Per-worker detail table */}
      {selected && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={selected.workerName || '?'} size={28} />
              <Eyebrow>[{selected.workerName.toUpperCase()}] · {selected.count} CARS</Eyebrow>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-3)', display: 'flex', padding: 4 }}
            >
              <Icon name="x" size={16} color="currentColor" />
            </button>
          </div>
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Time', 'Unit', 'Resident', 'Vehicle', 'Type'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.logs
                  .slice()
                  .sort((a, b) => {
                    const ta = (a.cleanedAt as any)?.toDate?.()?.getTime?.() ?? 0;
                    const tb = (b.cleanedAt as any)?.toDate?.()?.getTime?.() ?? 0;
                    return tb - ta;
                  })
                  .map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)' }}>
                        {formatTime(log.cleanedAt)}
                      </td>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-sage-hi)' }}>
                        {log.unitNumber}
                      </td>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                        {log.customerName}
                      </td>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>
                          {log.vehicleRegistration}
                        </span>
                        {(log.vehicleMake || log.vehicleModel) && (
                          <span style={{ color: 'var(--pc-fg-3)', marginLeft: 6 }}>
                            {[log.vehicleMake, log.vehicleModel].filter(Boolean).join(' ')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        <span style={{
                          fontFamily: 'var(--pc-mono)', fontSize: 10.5, letterSpacing: '0.05em',
                          color: 'var(--pc-sage-hi)',
                          background: 'color-mix(in srgb, var(--pc-sage) 12%, transparent)',
                          borderRadius: 4, padding: '3px 8px',
                        }}>
                          {log.serviceType.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
