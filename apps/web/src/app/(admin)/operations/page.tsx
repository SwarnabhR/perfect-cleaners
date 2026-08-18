'use client';
import { useEffect, useState } from 'react';
import { collection, collectionGroup, onSnapshot, orderBy, query, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';

type Item = { id: string; kind: string; title: string; detail: string; ref: string; status?: string };
export default function OperationsPage() {
 const [items, setItems] = useState<Item[]>([]);
 useEffect(() => { const all: Item[] = []; const publish = () => setItems([...all]);
  const issues = onSnapshot(query(collection(db, 'workerIssues'), orderBy('createdAt', 'desc'), limit(100)), s => { const next = s.docs.map(d => ({ id: d.id, kind: 'Worker issue', title: d.data().reason ?? 'Job issue', detail: `Session ${d.data().sessionId ?? ''}`, ref: `workerIssues/${d.id}`, status: d.data().status })); all.splice(0, all.length, ...next, ...all.filter(x => x.kind !== 'Worker issue')); publish(); });
  const support = onSnapshot(query(collectionGroup(db, 'messages'), orderBy('createdAt', 'desc'), limit(100)), s => { const next = s.docs.filter(d => d.ref.path.startsWith('support/')).map(d => ({ id: d.id, kind: 'Customer support', title: d.data().from === 'customer' ? 'Customer message' : 'Support reply', detail: d.data().text ?? '', ref: d.ref.path, status: d.data().status })); const keep = all.filter(x => x.kind !== 'Customer support'); all.splice(0, all.length, ...next, ...keep); publish(); });
  return () => { issues(); support(); };
 }, []);
 async function resolve(item: Item) { if (item.kind === 'Worker issue') await updateDoc(doc(db, item.ref), { status: 'resolved' }); else await updateDoc(doc(db, item.ref), { status: 'resolved' }); }
 return <div className="admin-page-root"><div><Eyebrow style={{ display: 'block', marginBottom: 4 }}>WORK QUEUE</Eyebrow><h1 className="admin-page-title">Operations inbox</h1></div>{items.length === 0 ? <Card style={{ padding: 32, color: 'var(--pc-fg-3)', textAlign: 'center' }}>No open operational items.</Card> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{items.filter(i => i.status !== 'resolved').map(i => <Card key={`${i.kind}-${i.id}`} style={{ padding: 16, display: 'flex', gap: 16, justifyContent: 'space-between' }}><div><p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>{i.kind.toUpperCase()}</p><p style={{ fontFamily: 'var(--pc-sans)', fontWeight: 600, margin: '6px 0', color: 'var(--pc-fg)' }}>{i.title}</p><p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, margin: 0, color: 'var(--pc-fg-3)' }}>{i.detail}</p></div><button type="button" onClick={() => resolve(i)} style={{ alignSelf: 'center', padding: '8px 14px', borderRadius: 999, border: '1px solid var(--pc-line)', background: 'transparent', color: 'var(--pc-fg-2)', fontFamily: 'var(--pc-sans)', cursor: 'pointer' }}>Resolve</button></Card>)}</div>}</div>;
}
