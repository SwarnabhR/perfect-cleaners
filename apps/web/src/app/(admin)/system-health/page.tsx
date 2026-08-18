'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import { CRON_TASKS as TASKS } from '@/lib/cron-tasks';

type Health = { id: string; lastRunStatus?: string; lastRunDetail?: string; lastSuccessAt?: { toDate(): Date }; lastRunAt?: { toDate(): Date } };
function time(v?: { toDate(): Date }) { return v?.toDate ? v.toDate().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'; }
export default function SystemHealthPage() {
  const [health, setHealth] = useState<Record<string, Health>>({});
  useEffect(() => onSnapshot(collection(db, 'cronHealth'), s => setHealth(Object.fromEntries(s.docs.map(d => [d.id, { id: d.id, ...d.data() } as Health])))), []);
  return <div className="admin-page-root"><div><Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow><h1 className="admin-page-title">System health</h1><p style={{ fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg-3)', fontSize: 14 }}>Last reported result for each required automated task.</p></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>{TASKS.map(task => { const h = health[task]; const good = h?.lastRunStatus === 'success'; return <Card key={task} style={{ padding: 18, borderColor: good ? 'var(--pc-line)' : 'var(--pc-danger)' }}><p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>{task.toUpperCase()}</p><p style={{ fontFamily: 'var(--pc-sans)', color: good ? 'var(--pc-success)' : 'var(--pc-danger)', fontWeight: 600, margin: '10px 0 4px' }}>{good ? 'Healthy' : h ? 'Needs attention' : 'No heartbeat'}</p><p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>Last success: {time(h?.lastSuccessAt)}</p>{h?.lastRunDetail && <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-danger)', margin: '8px 0 0' }}>{h.lastRunDetail}</p>}</Card>; })}</div></div>;
}
