'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningLog } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface LogRow extends CleaningLog { id: string }

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function formatTime(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function WorkerDashboard() {
  const { worker, user } = useWorkerAuth();
  const [logs,     setLogs]     = useState<LogRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);

  // Today's cleaning logs for this worker
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'cleaningLogs'),
      where('workerId', '==', user.uid),
      where('cleanedAt', '>=', todayStart()),
      orderBy('cleanedAt', 'desc'),
      limit(200),
    );
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LogRow)));
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  // Total subscribed cars in assigned society (for progress denominator)
  useEffect(() => {
    if (!worker?.assignedSocietyId) { setTotal(0); return; }
    const q = query(
      collection(db, 'customers'),
      where('societyId', '==', worker.assignedSocietyId),
    );
    // One-time fetch is enough for the denominator
    import('firebase/firestore').then(({ getDocs }) =>
      getDocs(q).then(snap => {
        const carCount = snap.docs.reduce(
          (sum, d) => sum + ((d.data().vehicles as any[])?.length ?? 0), 0,
        );
        setTotal(carCount);
      }).catch(() => {}),
    );
  }, [worker?.assignedSocietyId]);

  async function toggleOnline() {
    if (!user || !worker) return;
    setToggling(true);
    await updateDoc(doc(db, 'workers', user.uid), { isOnline: !worker.isOnline });
    setToggling(false);
  }

  const done = logs.length;
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0;

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 'var(--pc-space-3)' }}>
        <div>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 4px' }}>{greeting},</p>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
            {worker?.name?.split(' ')[0] ?? 'Worker'}.
          </h1>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          disabled={toggling}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 999,
            background: worker?.isOnline ? 'rgba(111,174,106,0.15)' : 'var(--pc-card)',
            border: `1px solid ${worker?.isOnline ? 'rgba(111,174,106,0.4)' : 'var(--pc-line-strong)'}`,
            cursor: toggling ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            color: worker?.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-3)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: worker?.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-4)' }} />
          {worker?.isOnline ? 'Online' : 'Go Online'}
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        {[
          { label: 'Cars Done Today', value: done,                                                                   icon: 'check-circle'  },
          { label: 'Remaining',       value: total > 0 ? Math.max(0, total - done) : '—',                           icon: 'circle-dot'    },
          { label: "Today's Earn",    value: `₹${(worker?.earnings?.today ?? 0).toLocaleString('en-IN')}`,          icon: 'indian-rupee'  },
        ].map(s => (
          <Card key={s.label} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Icon name={s.icon} size={16} color="var(--pc-fg-3)" />
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, fontWeight: 600, color: 'var(--pc-fg)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* Society assignment card */}
      {worker?.assignedSocietyId ? (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 10 }}>TODAY'S ASSIGNMENT</Eyebrow>
          <Card style={{ padding: 'var(--pc-space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="building-2" size={18} color="var(--pc-sage-ink)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                  {worker.assignedSocietyName ?? 'Society'}
                </p>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.05em' }}>
                  ASSIGNED SOCIETY
                </p>
              </div>
              <div style={{
                padding: '4px 12px', borderRadius: 999,
                background: pct === 100 ? 'rgba(111,174,106,0.15)' : 'rgba(91,111,82,0.15)',
                border: `1px solid ${pct === 100 ? 'rgba(111,174,106,0.4)' : 'rgba(91,111,82,0.4)'}`,
                fontFamily: 'var(--pc-mono)', fontSize: 11,
                color: pct === 100 ? 'var(--pc-success)' : 'var(--pc-sage-hi)',
              }}>
                {done}/{total > 0 ? total : '?'} done
              </div>
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div style={{ height: 4, background: 'var(--pc-line)', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', background: pct === 100 ? 'var(--pc-success)' : 'var(--pc-sage)', borderRadius: 999, width: `${pct}%`, transition: 'width 0.4s ease' }} />
              </div>
            )}

            <Link href="/worker/cleaning-logs" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-sage-hi)',
              textDecoration: 'none',
            }}>
              <span>View full cleaning log</span>
              <Icon name="arrow-right" size={14} color="var(--pc-sage-hi)" />
            </Link>
          </Card>
        </div>
      ) : (
        <Card style={{ padding: 'var(--pc-space-8)', textAlign: 'center' }}>
          <Icon name="building-2" size={32} color="var(--pc-fg-4)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No society assigned.</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.6 }}>
            Contact your admin to get assigned to a society before starting your shift.
          </p>
        </Card>
      )}

      {/* Recent cleaning log */}
      {logs.length > 0 && (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 10 }}>RECENT CLEANS · TODAY</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.slice(0, 10).map(log => (
              <Card key={log.id} style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(111,174,106,0.15)', border: '1px solid rgba(111,174,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={12} color="var(--pc-success)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.unitNumber} · {log.customerName}
                    </p>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.04em' }}>
                      {log.vehicleRegistration}
                      {(log.vehicleMake || log.vehicleModel) && ` · ${[log.vehicleMake, log.vehicleModel].filter(Boolean).join(' ')}`}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
                    {formatTime(log.cleanedAt)}
                  </span>
                </div>
              </Card>
            ))}
            {logs.length > 10 && (
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', textAlign: 'center', margin: 0 }}>
                +{logs.length - 10} more cleans today
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && logs.length === 0 && worker?.assignedSocietyId && (
        <Card style={{ padding: 'var(--pc-space-8)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No cleans logged yet.</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.6 }}>
            Use the mobile app to mark cars as cleaned. Logs appear here in real time.
          </p>
        </Card>
      )}
    </div>
  );
}
