'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Worker } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveWorker = Worker & { id: string };

interface LiveCleaningLog {
  id: string;
  societyName?: string;
  tower?: string;
  vehicleRegistration?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  customerId?: string;
  customerName?: string;
  unitNumber?: string;
  workerId?: string;
  workerName?: string;
  cleanedAt: { toDate?(): Date } | Date | string | number | null | undefined;
  serviceType?: 'exterior' | 'interior' | 'both';
  rating?: number;
}

type Window = 'today' | '7d' | 'all';

type MaybeTs = { toDate?(): Date } | Date | string | number | null | undefined;
function toDate(ts: MaybeTs): Date | null {
  if (!ts) return null;
  return (ts as { toDate?(): Date }).toDate
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as string | number | Date);
}
function fmtTime(ts: MaybeTs): string {
  const d = toDate(ts);
  return d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
}
function fmtDateTime(ts: MaybeTs): string {
  const d = toDate(ts);
  return d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

const SERVICE_LABEL: Record<string, string> = { exterior: 'Exterior', interior: 'Interior', both: 'Interior + Exterior' };

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)',
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
};

export default function CleaningLogsPage() {
  const [logs,       setLogs]       = useState<LiveCleaningLog[]>([]);
  const [workers,    setWorkers]    = useState<LiveWorker[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [windowFilter, setWindowFilter] = useState<Window>('today');
  const [search,     setSearch]     = useState('');
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'cleaningLogs'), orderBy('cleanedAt', 'desc'), limit(1000)),
      snap => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveCleaningLog)));
        setLoading(false);
      },
      err => { console.warn('[CleaningLogs]', err.message); setLoading(false); },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'workers'),
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker))),
      err => console.warn('[CleaningLogs] workers:', err.message),
    );
  }, []);

  const workersById = new Map(workers.map(w => [w.id, w]));

  // ── Time window ──────────────────────────────────────────────────────────
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const inWindow = logs.filter(l => {
    const d = toDate(l.cleanedAt);
    if (!d) return false;
    if (windowFilter === 'today') return d >= todayStart;
    if (windowFilter === '7d')    return d.getTime() >= sevenDaysAgo;
    return true;
  });

  // ── Search (flat, cross-worker — for "was my car cleaned today?") ─────────
  const searchLower = search.trim().toLowerCase();
  const searchResults = searchLower
    ? inWindow.filter(l =>
        l.customerName?.toLowerCase().includes(searchLower) ||
        l.vehicleRegistration?.toLowerCase().includes(searchLower) ||
        l.unitNumber?.toLowerCase().includes(searchLower))
    : [];

  // ── Per-worker breakdown ────────────────────────────────────────────────
  const byWorker = new Map<string, { workerName: string; societyName: string; logs: LiveCleaningLog[] }>();
  inWindow.forEach(l => {
    const wid = l.workerId || 'unknown';
    if (!byWorker.has(wid)) {
      const w = workersById.get(wid);
      byWorker.set(wid, {
        workerName: l.workerName || w?.name || 'Unknown worker',
        societyName: w?.assignedSocietyName || l.societyName || '—',
        logs: [],
      });
    }
    byWorker.get(wid)!.logs.push(l);
  });
  const workerRows = [...byWorker.entries()]
    .map(([workerId, v]) => ({
      workerId,
      ...v,
      count: v.logs.length,
      lastActivity: v.logs.reduce<Date | null>((max, l) => {
        const d = toDate(l.cleanedAt);
        return d && (!max || d > max) ? d : max;
      }, null),
    }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...workerRows.map(r => r.count), 1);

  const kpis = [
    { label: 'Cars Cleaned Today',   value: loading ? '—' : String(logs.filter(l => { const d = toDate(l.cleanedAt); return d ? d >= todayStart : false; }).length), icon: 'sparkles', color: 'var(--pc-sage)' },
    { label: 'Cars Cleaned (7d)',    value: loading ? '—' : String(logs.filter(l => { const d = toDate(l.cleanedAt); return d ? d.getTime() >= sevenDaysAgo : false; }).length), icon: 'trending-up', color: 'var(--pc-info)' },
    { label: 'Active Workers (window)', value: loading ? '—' : String(workerRows.length), icon: 'hard-hat', color: 'var(--pc-success)' },
    { label: 'Total Logs Loaded',    value: loading ? '—' : String(logs.length), icon: 'list-checks', color: 'var(--pc-fg-3)' },
  ];

  const WINDOW_OPTS: { key: Window; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d',    label: 'Last 7 Days' },
    { key: 'all',   label: 'All Time' },
  ];

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
        <h1 className="admin-page-title">Cleaning Activity</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
          Real-time log of every car cleaned — verify shifts, spot under-performing societies, resolve &ldquo;was my car cleaned today?&rdquo; complaints.
        </p>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {kpis.map(({ label, value, icon, color }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color={color} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find a resident's car — name, plate, or unit…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, boxSizing: 'border-box',
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WINDOW_OPTS.map(w => (
            <button type="button" key={w.key} onClick={() => setWindowFilter(w.key)} style={{
              padding: '7px 14px', borderRadius: 999, border: '1px solid',
              borderColor: windowFilter === w.key ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  windowFilter === w.key ? 'var(--pc-sage)' : 'transparent',
              color:       windowFilter === w.key ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
            }}>{w.label}</button>
          ))}
        </div>
      </div>

      {/* Search results — flat cross-worker view, takes over when searching */}
      {searchLower ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--pc-line)' }}>
            <Eyebrow>{searchResults.length} MATCH{searchResults.length === 1 ? '' : 'ES'}</Eyebrow>
          </div>
          {searchResults.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
              No matching cleans in this window.
            </div>
          ) : (
            <div className="table-scroll-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    {['Time', 'Resident', 'Unit', 'Vehicle', 'Service', 'Worker'].map(h => (
                      <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', whiteSpace: 'nowrap' }}>{fmtDateTime(l.cleanedAt)}</td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 500 }}>{l.customerName || '—'}</td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{l.unitNumber || '—'}</td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{l.vehicleRegistration || '—'}</td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{SERVICE_LABEL[l.serviceType ?? 'exterior']}</td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{l.workerName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (

        /* Per-worker breakdown */
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
          ) : workerRows.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No cleaning activity in this window.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {workerRows.map((row, idx) => {
                const expanded = expandedWorkerId === row.workerId;
                return (
                  <div key={row.workerId} style={{ borderBottom: idx < workerRows.length - 1 ? '1px solid var(--pc-line)' : 'none' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedWorkerId(expanded ? null : row.workerId)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                          {row.workerName[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div style={{ flex: '1 1 180px', minWidth: 140 }}>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500, margin: '0 0 1px' }}>{row.workerName}</p>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{row.societyName}</p>
                      </div>
                      <div style={{ flex: '2 1 160px', minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{row.count} car{row.count === 1 ? '' : 's'} cleaned</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--pc-line-strong)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(row.count / maxCount) * 100}%`, background: 'var(--pc-sage)', borderRadius: 999 }} />
                        </div>
                      </div>
                      <div style={{ flex: '1 1 120px', minWidth: 100, textAlign: 'right' }}>
                        <p style={monoLabel}>Last Activity</p>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', margin: '2px 0 0' }}>{row.lastActivity ? fmtTime(row.lastActivity) : '—'}</p>
                      </div>
                      <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} color="var(--pc-fg-4)" style={{ flexShrink: 0 }} />
                    </button>

                    {expanded && (
                      <div className="table-scroll-wrap" style={{ background: 'var(--pc-card-hi)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                              {['Time', 'Unit', 'Resident', 'Vehicle', 'Service'].map(h => (
                                <th key={h} style={{ padding: '9px 18px 9px 66px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 10.5, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {row.logs
                              .slice()
                              .sort((a, b) => (toDate(b.cleanedAt)?.getTime() ?? 0) - (toDate(a.cleanedAt)?.getTime() ?? 0))
                              .map(l => (
                              <tr key={l.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                                <td style={{ padding: '9px 18px 9px 66px', fontFamily: 'var(--pc-sans)', fontSize: 12.5, color: 'var(--pc-fg-3)', whiteSpace: 'nowrap' }}>{fmtTime(l.cleanedAt)}</td>
                                <td style={{ padding: '9px 18px', fontFamily: 'var(--pc-mono)', fontSize: 11.5, color: 'var(--pc-fg-2)' }}>{l.unitNumber || '—'}</td>
                                <td style={{ padding: '9px 18px', fontFamily: 'var(--pc-sans)', fontSize: 12.5, color: 'var(--pc-fg)' }}>{l.customerName || '—'}</td>
                                <td style={{ padding: '9px 18px', fontFamily: 'var(--pc-mono)', fontSize: 11.5, color: 'var(--pc-fg-2)' }}>{l.vehicleRegistration || '—'}</td>
                                <td style={{ padding: '9px 18px', fontFamily: 'var(--pc-sans)', fontSize: 12.5, color: 'var(--pc-fg-2)' }}>{SERVICE_LABEL[l.serviceType ?? 'exterior']}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
