'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Worker } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';
import Avatar from '@/components/ui/Avatar';

type LiveWorker = Worker & { id: string };

type StatusFilter = 'All' | 'Available' | 'On Job' | 'Off Today';

function workerStatus(w: LiveWorker): string {
  if (!w.isOnline) return 'Off Today';
  if (w.activeBookingId) return 'On Job';
  return 'Available';
}

function formatJoined(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function StarRating({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name="star" size={11} color={i <= filled ? 'var(--pc-gold)' : 'var(--pc-line)'} />
      ))}
      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', marginLeft: 4 }}>
        {value ? value.toFixed(1) : '—'}
      </span>
    </span>
  );
}

export default function WorkersPage() {
  const [workers,        setWorkers]        = useState<LiveWorker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<LiveWorker | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('All');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'workers'), orderBy('totalJobs', 'desc')),
      snap => {
        setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker)));
        setLoading(false);
      },
      err => { console.warn('[Workers] Firestore:', err.message); setLoading(false); },
    );
  }, []);

  const kpis = {
    total:     workers.length,
    onDuty:    workers.filter(w => w.isOnline).length,
    available: workers.filter(w => w.isOnline && !w.activeBookingId).length,
    avgRating: workers.length
      ? (workers.reduce((s, w) => s + (w.rating ?? 0), 0) / workers.length).toFixed(1)
      : '—',
  };

  const filtered = workers.filter(w => {
    const matchSearch = !search ||
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.phone?.includes(search);
    const matchStatus = statusFilter === 'All' || workerStatus(w) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>TEAM</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Workers</h1>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {[
          { label: 'Total Workers', value: loading ? '—' : kpis.total,     icon: 'users'      },
          { label: 'On Duty Today', value: loading ? '—' : kpis.onDuty,    icon: 'user-check' },
          { label: 'Available Now', value: loading ? '—' : kpis.available, icon: 'circle-dot' },
          { label: 'Avg Rating',    value: loading ? '—' : kpis.avgRating, icon: 'star'       },
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

      {/* Search + status filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, boxSizing: 'border-box',
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['All', 'Available', 'On Job', 'Off Today'] as StatusFilter[]).map(s => (
            <button type="button" key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 14px', borderRadius: 999, border: '1px solid',
              borderColor: statusFilter === s ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  statusFilter === s ? 'var(--pc-sage)' : 'transparent',
              color:       statusFilter === s ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No workers found.</div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Worker', 'Phone', 'Status', 'Jobs Done', 'Rating', 'This Week', 'This Month', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedWorker(w)}
                    style={{ borderBottom: '1px solid var(--pc-line)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={w.name} size={32} />
                        <div>
                          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{w.name || '—'}</p>
                          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>{w.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {w.phone || '—'}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill status={workerStatus(w)} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>
                      {w.totalJobs ?? 0}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StarRating value={w.rating ?? 0} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>
                      {w.earnings?.week ? `₹${w.earnings.week.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>
                      {w.earnings?.month ? `₹${w.earnings.month.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                      {formatJoined((w as any).createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail panel */}
      {selectedWorker && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setSelectedWorker(null)}
        >
          <div
            style={{
              background: 'var(--pc-card)', borderRadius: 16,
              border: '1px solid var(--pc-line)',
              padding: 28, width: 400, maxWidth: '90vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Worker identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Avatar name={selectedWorker.name} size={56} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{selectedWorker.name}</h2>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 6px' }}>{selectedWorker.phone}</p>
                <StatusPill status={workerStatus(selectedWorker)} />
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Jobs Done',  value: selectedWorker.totalJobs ?? 0 },
                { label: 'Rating',     value: selectedWorker.rating ? `${selectedWorker.rating.toFixed(1)} / 5.0` : '—' },
                { label: 'Today',      value: selectedWorker.earnings?.today  ? `₹${selectedWorker.earnings.today.toLocaleString('en-IN')}`  : '₹0' },
                { label: 'This Week',  value: selectedWorker.earnings?.week   ? `₹${selectedWorker.earnings.week.toLocaleString('en-IN')}`   : '₹0' },
                { label: 'This Month', value: selectedWorker.earnings?.month  ? `₹${selectedWorker.earnings.month.toLocaleString('en-IN')}` : '₹0' },
                { label: 'Joined',     value: formatJoined((selectedWorker as any).createdAt) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Worker ID */}
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: '0 0 16px', letterSpacing: '0.04em' }}>
              ID: {selectedWorker.id}
            </p>

            <button
              type="button"
              onClick={() => setSelectedWorker(null)}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 999,
                background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
                fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
