'use client';

import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type Notice = { id: string; title?: string; body?: string; read?: boolean; createdAt?: { toDate?(): Date } };

export default function WorkerNotificationsPage() {
  const { worker } = useWorkerAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => {
    if (!worker) return;
    return onSnapshot(query(collection(db, 'workers', worker.id, 'notifications'), orderBy('createdAt', 'desc'), limit(100)), snap =>
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice))),
      err => console.warn('[WorkerNotifications]', err.message));
  }, [worker?.id]);
  async function markRead(id: string) {
    if (!worker) return;
    await updateDoc(doc(db, 'workers', worker.id, 'notifications', id), { read: true });
  }
  return <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg) var(--pc-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
    <div style={{ paddingTop: 'var(--pc-space-3)' }}><Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow><h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Alerts</h1></div>
    {notices.length === 0 ? <Card style={{ padding: 32, textAlign: 'center' }}><Icon name="bell" size={24} color="var(--pc-fg-4)" style={{ margin: '0 auto 10px' }} /><p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>No operational alerts.</p></Card> : notices.map(n => <Card key={n.id} style={{ padding: 16, borderColor: n.read ? 'var(--pc-line)' : 'var(--pc-sage)' }}><button type="button" onClick={() => markRead(n.id)} style={{ width: '100%', border: 0, background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}><p style={{ fontFamily: 'var(--pc-sans)', fontWeight: 600, fontSize: 14, color: 'var(--pc-fg)', margin: 0 }}>{n.title ?? 'Operations update'}</p><p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', lineHeight: 1.45, margin: '5px 0 0' }}>{n.body ?? ''}</p></button></Card>)}
  </div>;
}
