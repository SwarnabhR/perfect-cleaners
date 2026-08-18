'use client';

import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import AccountTabBar from '../AccountTabBar';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import { usePathname, useRouter } from 'next/navigation';

type Notice = { id: string; title?: string; body?: string; read?: boolean; createdAt?: { toDate?(): Date } };
export default function CustomerNotificationsPage() {
  const { user, loading } = useCustomerAuth(); const router = useRouter(); const pathname = usePathname();
  const [items, setItems] = useState<Notice[]>([]);
  useEffect(() => { if (!loading && !user) router.replace('/signin?from=/account/notifications'); }, [loading, user, router]);
  useEffect(() => { if (!user) return; return onSnapshot(query(collection(db, 'customers', user.uid, 'notifications'), orderBy('createdAt', 'desc'), limit(100)), snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)))); }, [user?.uid]);
  if (!user) return null;
  return <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', color: 'var(--pc-fg)', display: 'flex', flexDirection: 'column' }}><Nav /><main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: 'var(--pc-space-12) var(--pc-space-6) var(--pc-space-20)' }}><h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 36, fontWeight: 400, margin: '0 0 var(--pc-space-6)' }}>Updates</h1><AccountTabBar pathname={pathname} />{items.length === 0 ? <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 32, color: 'var(--pc-fg-3)', fontFamily: 'var(--pc-sans)' }}>No updates yet.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{items.map(n => <button key={n.id} type="button" onClick={() => updateDoc(doc(db, 'customers', user.uid, 'notifications', n.id), { read: true })} style={{ textAlign: 'left', padding: 18, background: 'var(--pc-card)', border: `1px solid ${n.read ? 'var(--pc-line)' : 'var(--pc-sage)'}`, borderRadius: 'var(--pc-radius-md)', color: 'var(--pc-fg)', cursor: 'pointer' }}><strong style={{ fontFamily: 'var(--pc-sans)', fontSize: 14 }}>{n.title ?? 'Perfect Cleaners'}</strong><p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '6px 0 0' }}>{n.body ?? ''}</p></button>)}</div>}</main><Footer /></div>;
}
