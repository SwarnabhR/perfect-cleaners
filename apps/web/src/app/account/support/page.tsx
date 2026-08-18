'use client';
import { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';

export default function CustomerSupportPage() {
  const { user } = useCustomerAuth(); const [text, setText] = useState(''); const [messages, setMessages] = useState<{ id: string; text?: string; from?: string }[]>([]);
  useEffect(() => { if (!user) return; return onSnapshot(query(collection(db, 'support', user.uid, 'messages'), orderBy('createdAt', 'asc')), snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }, [user?.uid]);
  async function send(e: React.FormEvent) { e.preventDefault(); if (!user || !text.trim()) return; await addDoc(collection(db, 'support', user.uid, 'messages'), { from: 'customer', text: text.trim(), createdAt: serverTimestamp(), status: 'open' }); setText(''); }
  if (!user) return null;
  return <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', color: 'var(--pc-fg)', display: 'flex', flexDirection: 'column' }}><Nav /><main style={{ flex: 1, maxWidth: 700, width: '100%', margin: '0 auto', padding: 'var(--pc-space-12) var(--pc-space-6)' }}><p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>SUPPORT</p><h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 36, fontWeight: 400, margin: '0 0 20px' }}>How can we help?</h1><div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>{messages.map(m => <div key={m.id} style={{ alignSelf: m.from === 'customer' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: 14, background: m.from === 'customer' ? 'var(--pc-sage)' : 'var(--pc-card)', fontFamily: 'var(--pc-sans)', fontSize: 14 }}>{m.text}</div>)}</div><form onSubmit={send} style={{ display: 'flex', gap: 8 }}><input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="Describe your issue" style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--pc-line)', background: 'var(--pc-card)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)' }} /><button style={{ padding: '0 18px', border: 0, borderRadius: 10, background: 'var(--pc-warm)', color: 'var(--pc-ink)', fontFamily: 'var(--pc-sans)', fontWeight: 600 }}>Send</button></form></main><Footer /></div>;
}
