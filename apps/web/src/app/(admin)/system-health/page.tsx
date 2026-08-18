'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import { CRON_TASKS as TASKS } from '@/lib/cron-tasks';

type Stamp = { toDate(): Date };
type Health = {
  id: string;
  lastRunStatus?: string;
  lastRunDetail?: string;
  lastSuccessAt?: Stamp;
  lastRunAt?: Stamp;
};

function time(v?: Stamp) {
  return v?.toDate
    ? v.toDate().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never';
}

// Three distinct states with three distinct fixes: healthy, ran-and-failed
// (debug the endpoint), and never-ran (the job isn't registered with the
// external scheduler at all). Collapsing the last two sends the owner
// looking for a bug that isn't there.
function classify(h: Health | undefined): { label: string; color: string; ok: boolean } {
  if (h?.lastRunStatus === 'success') return { label: 'Healthy', color: 'var(--pc-success)', ok: true };
  if (!h?.lastRunAt) return { label: 'Never run', color: 'var(--pc-warning)', ok: false };
  return { label: 'Last run failed', color: 'var(--pc-danger)', ok: false };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<Record<string, Health>>({});

  useEffect(() => onSnapshot(
    collection(db, 'cronHealth'),
    s => setHealth(Object.fromEntries(s.docs.map(d => [d.id, { id: d.id, ...d.data() } as Health]))),
    err => console.warn('[SystemHealth]', err.message),
  ), []);

  return (
    <div className="admin-page-root">
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
        <h1 className="admin-page-title">System health</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg-3)', fontSize: 14, margin: '4px 0 0' }}>
          Last reported result for each required automated task.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
        {TASKS.map(task => {
          const h = health[task];
          const state = classify(h);
          return (
            <Card key={task} style={{
              padding: 18,
              borderColor: state.ok ? 'var(--pc-line)' : `color-mix(in srgb, ${state.color} 45%, transparent)`,
            }}>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.06em' }}>
                {task.toUpperCase()}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', color: state.color, fontWeight: 600, margin: '10px 0 4px' }}>
                {state.label}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                Last success: {time(h?.lastSuccessAt)}
              </p>
              {!h?.lastRunAt && (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
                  Not registered with the scheduler yet — see CRON_SETUP.md.
                </p>
              )}
              {h?.lastRunDetail && h.lastRunStatus !== 'success' && (
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-danger)', margin: '8px 0 0' }}>
                  {h.lastRunDetail}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
