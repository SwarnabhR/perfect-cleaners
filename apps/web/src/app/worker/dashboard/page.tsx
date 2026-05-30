'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { BookingStatus } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface JobRow {
  id:          string;
  bookingRef:  string;
  status:      BookingStatus;
  serviceName: string;
  scheduledAt: Date;
  customerName: string;
  customerPhone: string;
  address:     string;
  total:       number;
}

const STATUS_COLOR: Record<string, string> = {
  assigned:   'var(--pc-info)',
  enroute:    'var(--pc-warning)',
  inprogress: 'var(--pc-sage-hi)',
  done:       'var(--pc-success)',
  pending:    'var(--pc-fg-3)',
  cancelled:  'var(--pc-danger)',
};

const STATUS_LABEL: Record<string, string> = {
  assigned:   'Assigned',
  enroute:    'En Route',
  inprogress: 'In Progress',
  done:       'Done',
  pending:    'Pending',
  cancelled:  'Cancelled',
};

export default function WorkerDashboard() {
  const { worker, user } = useWorkerAuth();
  const [jobs,    setJobs]    = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Today's jobs assigned to this worker
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('workerId', '==', user.uid),
    );
    return onSnapshot(q, snap => {
      const rows: JobRow[] = snap.docs
        .map(d => {
          const data = d.data();
          const scheduledAt = data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt ?? 0);
          return {
            id:            d.id,
            bookingRef:    data.bookingRef ?? d.id.slice(0, 8).toUpperCase(),
            status:        data.status as BookingStatus,
            serviceName:   data.serviceIds?.[0]?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Service',
            scheduledAt,
            customerName:  data.customerName ?? '—',
            customerPhone: data.customerPhone ?? '',
            address:       [data.address?.line1, data.address?.city].filter(Boolean).join(', '),
            total:         data.priceBreakdown?.total ?? 0,
          };
        })
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
      setJobs(rows);
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  async function toggleOnline() {
    if (!user || !worker) return;
    setToggling(true);
    await updateDoc(doc(db, 'workers', user.uid), { isOnline: !worker.isOnline });
    setToggling(false);
  }

  const activeJob    = jobs.find(j => j.status === 'inprogress' || j.status === 'enroute');
  const upcomingJobs = jobs.filter(j => j.status === 'assigned');
  const doneToday    = jobs.filter(j => j.status === 'done').length;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

      {/* Greeting + online toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 'var(--pc-space-3)' }}>
        <div>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 4px' }}>{greeting},</p>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
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
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: worker?.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-4)' }} />
          {worker?.isOnline ? 'Online' : 'Go Online'}
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: "Today's Jobs",  value: upcomingJobs.length + (activeJob ? 1 : 0), icon: 'calendar'       },
          { label: 'Completed',     value: doneToday,                                  icon: 'check-circle'   },
          { label: "Today's Earn",  value: `₹${(worker?.earnings?.today ?? 0).toLocaleString('en-IN')}`, icon: 'indian-rupee' },
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

      {/* Active job */}
      {activeJob && (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 10 }}>ACTIVE JOB</Eyebrow>
          <Link href={`/worker/job/${activeJob.id}`} style={{ textDecoration: 'none' }}>
            <Card style={{
              padding: 'var(--pc-space-5)',
              border: '1px solid rgba(74,94,68,0.5)',
              boxShadow: 'var(--pc-shadow-glow-sage)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: '0 0 4px', letterSpacing: '0.08em' }}>{activeJob.bookingRef}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>{activeJob.serviceName}</p>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(74,94,68,0.15)', border: '1px solid rgba(74,94,68,0.3)', fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 600, color: 'var(--pc-sage-hi)' }}>
                  {STATUS_LABEL[activeJob.status]}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="user" size={13} color="var(--pc-fg-4)" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{activeJob.customerName}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="map-pin" size={13} color="var(--pc-fg-4)" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{activeJob.address}</span>
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--pc-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                  {activeJob.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-sage-hi)' }}>
                  View Job →
                </span>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Upcoming jobs */}
      {upcomingJobs.length > 0 && (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 10 }}>UPCOMING</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingJobs.map(job => (
              <Link key={job.id} href={`/worker/job/${job.id}`} style={{ textDecoration: 'none' }}>
                <Card style={{ padding: 'var(--pc-space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.serviceName}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.customerName} · {job.address}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                        {job.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>
                        ₹{job.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !activeJob && upcomingJobs.length === 0 && (
        <Card style={{ padding: 'var(--pc-space-10)', textAlign: 'center' }}>
          <Icon name="calendar-check" size={32} color="var(--pc-fg-4)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No jobs today.</p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.6 }}>
            {worker?.isOnline ? 'You\'re online — jobs will appear here when assigned.' : 'Go online to receive job assignments.'}
          </p>
        </Card>
      )}
    </div>
  );
}
