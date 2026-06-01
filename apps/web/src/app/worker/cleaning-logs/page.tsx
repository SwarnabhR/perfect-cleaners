'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningLog } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveLog = CleaningLog & { id: string };
type DateFilter = 'today' | 'week' | 'all';

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

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkerCleaningLogsPage() {
  const { user, worker } = useWorkerAuth();
  const [logs,       setLogs]       = useState<LiveLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = dateFilter === 'today'
      ? query(
          collection(db, 'cleaningLogs'),
          where('workerId', '==', user.uid),
          where('cleanedAt', '>=', todayStart()),
          orderBy('cleanedAt', 'desc'),
          limit(500),
        )
      : dateFilter === 'week'
        ? query(
            collection(db, 'cleaningLogs'),
            where('workerId', '==', user.uid),
            where('cleanedAt', '>=', Timestamp.fromDate(
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            )),
            orderBy('cleanedAt', 'desc'),
            limit(500),
          )
        : query(
            collection(db, 'cleaningLogs'),
            where('workerId', '==', user.uid),
            orderBy('cleanedAt', 'desc'),
            limit(300),
          );

    return onSnapshot(
      q,
      snap => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveLog)));
        setLoading(false);
      },
      err => { console.warn('[WorkerCleaningLogs]', err.message); setLoading(false); },
    );
  }, [user, dateFilter]);

  const totalEarned = logs.reduce((sum, l) => sum + (l.servicePrice ?? 0), 0);

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg) var(--pc-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 'var(--pc-space-3)' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>ACTIVITY LOG</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
            My Cleans
          </h1>
          {worker?.assignedSocietyName && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
              {worker.assignedSocietyName}
            </p>
          )}
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', 'week', 'all'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setDateFilter(f)}
              style={{
                padding: '7px 14px', borderRadius: 999, border: '1px solid',
                borderColor: dateFilter === f ? 'var(--pc-sage)' : 'var(--pc-line)',
                background:  dateFilter === f ? 'var(--pc-sage)' : 'transparent',
                color:       dateFilter === f ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
              }}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'Cars Cleaned', value: loading ? '—' : String(logs.length), icon: 'check-circle' },
          { label: 'Earned',       value: loading ? '—' : `₹${totalEarned.toLocaleString('en-IN')}`, icon: 'indian-rupee' },
        ].map(s => (
          <Card key={s.label} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--pc-sage-subtle, rgba(74,94,68,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={s.icon} size={16} color="var(--pc-sage-hi)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: '4px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Log table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>[CLEANING HISTORY]</Eyebrow>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="check-circle" size={32} color="var(--pc-fg-4)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 6px' }}>
              No cleans yet{dateFilter === 'today' ? ' today' : dateFilter === 'week' ? ' this week' : ''}.
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              Use the mobile app to log cleans — they appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Time', 'Unit', 'Resident', 'Vehicle', 'Type', 'Earned'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 10.5, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
                        {formatDate(log.cleanedAt)}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg)', margin: '2px 0 0' }}>
                        {formatTime(log.cleanedAt)}
                      </p>
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-sage-hi)', whiteSpace: 'nowrap' }}>
                      {log.unitNumber}
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {log.customerName}
                    </td>
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg)' }}>
                        {log.vehicleRegistration}
                      </span>
                      {(log.vehicleMake || log.vehicleModel) && (
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', marginLeft: 6 }}>
                          {[log.vehicleMake, log.vehicleModel].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontFamily: 'var(--pc-mono)', fontSize: 10.5,
                        letterSpacing: '0.05em',
                        color: 'var(--pc-sage-hi)',
                        background: 'color-mix(in srgb, var(--pc-sage) 12%, transparent)',
                        borderRadius: 4, padding: '3px 8px',
                        whiteSpace: 'nowrap',
                      }}>
                        {log.serviceType?.toUpperCase() ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--pc-serif)', fontSize: 14, color: 'var(--pc-success)', whiteSpace: 'nowrap' }}>
                      {log.servicePrice ? `+₹${log.servicePrice.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
