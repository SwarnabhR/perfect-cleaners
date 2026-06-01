'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { BookingStatus } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';

interface JobRow {
  id: string; bookingRef: string; status: BookingStatus;
  serviceName: string; scheduledAt: Date;
  customerName: string; address: string; total: number;
}

const STATUS_COLOR: Record<string, string> = {
  assigned: 'var(--pc-info)', enroute: 'var(--pc-warning)',
  inprogress: 'var(--pc-sage-hi)', done: 'var(--pc-success)',
  pending: 'var(--pc-fg-3)', cancelled: 'var(--pc-danger)',
};

const FILTERS = ['All', 'Upcoming', 'Active', 'Done', 'Cancelled'] as const;
type Filter = typeof FILTERS[number];

export default function JobsPage() {
  const { user } = useWorkerAuth();
  const [jobs,    setJobs]    = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>('All');

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'bookings'), where('workerId', '==', user.uid)),
      snap => {
        setJobs(snap.docs.map(d => {
          const data = d.data();
          return {
            id:           d.id,
            bookingRef:   data.bookingRef ?? d.id.slice(0, 8).toUpperCase(),
            status:       data.status as BookingStatus,
            serviceName:  (data.serviceIds?.[0] ?? 'Service').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            scheduledAt:  data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt ?? 0),
            customerName: data.customerName ?? '—',
            address:      [data.address?.line1, data.address?.city].filter(Boolean).join(', '),
            total:        data.priceBreakdown?.total ?? 0,
          };
        }).sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime()));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const filtered = jobs.filter(j => {
    if (filter === 'All')      return true;
    if (filter === 'Upcoming') return j.status === 'assigned';
    if (filter === 'Active')   return j.status === 'enroute' || j.status === 'inprogress';
    if (filter === 'Done')     return j.status === 'done';
    if (filter === 'Cancelled') return j.status === 'cancelled';
    return true;
  });

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg) var(--pc-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
      <div style={{ paddingTop: 'var(--pc-space-3)' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>ASSIGNMENTS</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
          My Jobs
        </h1>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 999,
            background: filter === f ? 'var(--pc-sage-subtle)' : 'var(--pc-card)',
            border: `1px solid ${filter === f ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: filter === f ? 600 : 400,
            color: filter === f ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg-2)',
            cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', textAlign: 'center', padding: 'var(--pc-space-10)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', textAlign: 'center', padding: 'var(--pc-space-10)' }}>No jobs found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(job => (
            <Link key={job.id} href={`/worker/job/${job.id}`} style={{ textDecoration: 'none' }}>
              <Card style={{ padding: 'var(--pc-space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: '0 0 3px', letterSpacing: '0.08em' }}>{job.bookingRef}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>{job.serviceName}</p>
                  </div>
                  <span style={{
                    flexShrink: 0, padding: '3px 8px', borderRadius: 999,
                    background: `${STATUS_COLOR[job.status]}22`,
                    border: `1px solid ${STATUS_COLOR[job.status]}44`,
                    fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 600,
                    color: STATUS_COLOR[job.status],
                  }}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>
                    {job.customerName} · {job.scheduledAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {job.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>₹{job.total.toLocaleString('en-IN')}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
