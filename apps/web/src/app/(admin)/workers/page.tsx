'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Worker } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type LiveWorker = Worker & { id: string };

function workerStatus(w: LiveWorker): string {
  if (!w.isOnline) return 'Off Today';
  if (w.activeBookingId) return 'On Job';
  return 'Available';
}

export default function WorkersPage() {
  const [workers,        setWorkers]        = useState<LiveWorker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<LiveWorker | null>(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'workers'), snap => {
      setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker)));
      setLoading(false);
    }, err => { console.warn('[Workers] Firestore:', err.message); setLoading(false); });
  }, []);

  const kpis = {
    total:     workers.length,
    onDuty:    workers.filter(w => w.isOnline).length,
    available: workers.filter(w => w.isOnline && !w.activeBookingId).length,
    avgRating: workers.length
      ? (workers.reduce((s, w) => s + (w.rating ?? 0), 0) / workers.length).toFixed(2)
      : '—',
  };

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>TEAM</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Workers</h1>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Workers', value: kpis.total,     icon: 'users'      },
          { label: 'On Duty Today', value: kpis.onDuty,    icon: 'user-check' },
          { label: 'Available Now', value: kpis.available, icon: 'circle-dot' },
          { label: 'Avg Rating',    value: kpis.avgRating, icon: 'star'       },
        ].map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                {loading ? '—' : value}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Worker cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
          Loading workers…
        </div>
      ) : workers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
          No workers found. Add workers via the Firebase console.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {workers.map(w => (
            <Card key={w.id} style={{ padding: 18, cursor: 'pointer' }} onClick={() => setSelectedWorker(w)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: '#fff' }}>
                      {w.name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 600 }}>{w.name}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                      {w.phone ?? 'Technician'}
                    </p>
                  </div>
                </div>
                <StatusPill status={workerStatus(w)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 1px' }}>{w.totalJobs ?? 0}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>JOBS</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 1px' }}>
                    {w.rating?.toFixed(1) ?? '—'}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>RATING</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 1px' }}>
                    {w.earnings?.week ? `₹${w.earnings.week.toLocaleString('en-IN')}` : '—'}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>THIS WEEK</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
              padding: 28, width: 360, maxWidth: '90vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, fontWeight: 600, color: '#fff' }}>
                  {selectedWorker.name?.[0]}
                </span>
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{selectedWorker.name}</h2>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>{selectedWorker.phone}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Status',    value: workerStatus(selectedWorker) },
                { label: 'Jobs Done', value: selectedWorker.totalJobs ?? 0 },
                { label: 'Rating',    value: selectedWorker.rating?.toFixed(1) ?? '—' },
                { label: 'This Week', value: selectedWorker.earnings?.week ? `₹${selectedWorker.earnings.week.toLocaleString('en-IN')}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
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
