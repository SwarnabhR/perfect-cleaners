'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface CompletedJob {
  id: string; bookingRef: string; serviceName: string;
  completedAt: Date; total: number;
}

export default function EarningsPage() {
  const { worker, user } = useWorkerAuth();
  const [jobs, setJobs] = useState<CompletedJob[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'bookings'), where('workerId', '==', user.uid), where('status', '==', 'done')),
      snap => {
        setJobs(snap.docs.map(d => {
          const data = d.data();
          return {
            id:          d.id,
            bookingRef:  data.bookingRef ?? d.id.slice(0, 8).toUpperCase(),
            serviceName: (data.serviceIds?.[0] ?? 'Service').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            completedAt: data.completedAt?.toDate?.() ?? data.updatedAt?.toDate?.() ?? new Date(),
            total:       data.priceBreakdown?.total ?? 0,
          };
        }).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()));
      },
    );
  }, [user]);

  const earnings = worker?.earnings ?? { today: 0, week: 0, month: 0 };

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg) var(--pc-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
      <div style={{ paddingTop: 'var(--pc-space-3)' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>FINANCES</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
          Earnings
        </h1>
      </div>

      {/* Earnings cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Today',     value: earnings.today },
          { label: 'This Week', value: earnings.week  },
          { label: 'This Month',value: earnings.month },
        ].map(({ label, value }) => (
          <Card key={label} style={{ padding: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)', margin: 0, lineHeight: 1 }}>
              ₹{value.toLocaleString('en-IN')}
            </p>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card style={{ padding: 'var(--pc-space-4)', display: 'flex', justifyContent: 'space-around' }}>
        {[
          { icon: 'briefcase', label: 'Total Jobs',   value: worker?.totalJobs ?? 0 },
          { icon: 'star',      label: 'Rating',        value: (worker?.rating ?? 0).toFixed(1) },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <Icon name={icon} size={18} color="var(--pc-fg-3)" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
          </div>
        ))}
      </Card>

      {/* Recent completed jobs */}
      {jobs.length > 0 && (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 12 }}>COMPLETED JOBS</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobs.slice(0, 20).map(job => (
              <div key={job.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--pc-space-4)',
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                borderRadius: 'var(--pc-radius-sm)',
              }}>
                <div>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{job.serviceName}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>
                    {job.completedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-success)' }}>
                  +₹{job.total.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
