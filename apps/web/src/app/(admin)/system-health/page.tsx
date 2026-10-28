'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import {
  CRON_TASKS as TASKS,
  CRON_TASK_MAX_AGE_MINUTES,
  cronHealthState,
  formatCronInterval,
  type CronHealthState,
} from '@/lib/cron-tasks';

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

// Four distinct states with four distinct fixes: healthy; ran-and-failed (debug
// the endpoint); stale (it used to succeed but the scheduler stopped calling
// it); never-ran (not registered at all). The previous version collapsed
// "stale" into "healthy" — a task that last succeeded two months ago showed
// green — which is exactly how silently-401ing cron jobs stayed unnoticed.
const STATE_UI: Record<CronHealthState, { label: string; color: string; ok: boolean }> = {
  healthy: { label: 'Healthy',           color: 'var(--pc-success)', ok: true  },
  failed:  { label: 'Last run failed',   color: 'var(--pc-danger)',  ok: false },
  stale:   { label: 'Stale',             color: 'var(--pc-warning)', ok: false },
  never:   { label: 'Never run',         color: 'var(--pc-warning)', ok: false },
};

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
          const state = cronHealthState(task, h);
          const ui = STATE_UI[state];
          const expected = formatCronInterval(CRON_TASK_MAX_AGE_MINUTES[task]);
          return (
            <Card key={task} style={{
              padding: 18,
              borderColor: ui.ok ? 'var(--pc-line)' : `color-mix(in srgb, ${ui.color} 45%, transparent)`,
            }}>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.06em' }}>
                {task.toUpperCase()}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', color: ui.color, fontWeight: 600, margin: '10px 0 4px' }}>
                {ui.label}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                Last success: {time(h?.lastSuccessAt)}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>
                Expected every {expected}
              </p>
              {state === 'never' && (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
                  Not registered with the scheduler yet — see CRON_SETUP.md.
                </p>
              )}
              {state === 'stale' && (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-warning)', margin: '8px 0 0' }}>
                  No successful run in over {expected}. Check the job is enabled on the scheduler and not pointed at the www. host.
                </p>
              )}
              {state === 'failed' && h?.lastRunDetail && (
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
