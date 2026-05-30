'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

export default function WorkerProfilePage() {
  const { user, worker, signOut } = useWorkerAuth();
  const [name,  setName]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (worker) setName(worker.name ?? ''); }, [worker]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    await setDoc(doc(db, 'workers', user.uid), { name: name.trim(), updatedAt: serverTimestamp() }, { merge: true });
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  const initials = (worker?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const phone = user?.phoneNumber?.replace('+91', '') ?? '';

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 16px',
    background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)',
    borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
  };

  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg) var(--pc-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
      <div style={{ paddingTop: 'var(--pc-space-3)' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>ACCOUNT</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>Profile</h1>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--pc-sage)', border: '2px solid var(--pc-sage-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 22, fontWeight: 600, color: 'var(--pc-sage-ink)' }}>{initials}</span>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 4px' }}>{worker?.name || 'Worker'}</p>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0, letterSpacing: '0.04em' }}>
            +91 {phone.slice(0, 5)} {phone.slice(5)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: 'briefcase', label: 'Total Jobs', value: worker?.totalJobs ?? 0 },
          { icon: 'star',      label: 'Rating',     value: (worker?.rating ?? 0).toFixed(1) },
          { icon: 'indian-rupee', label: 'This Month', value: `₹${(worker?.earnings?.month ?? 0).toLocaleString('en-IN')}` },
        ].map(({ icon, label, value }) => (
          <Card key={label} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
            <Icon name={icon} size={15} color="var(--pc-fg-3)" style={{ margin: '0 auto' }} />
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
          </Card>
        ))}
      </div>

      {/* Edit name */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 8 }}>
            Full name
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 8 }}>
            Mobile number
          </label>
          <input type="text" value={`+91 ${phone.slice(0, 5)} ${phone.slice(5)}`} readOnly style={{ ...inp, color: 'var(--pc-fg-3)', cursor: 'not-allowed' }} />
        </div>
        <button type="submit" disabled={saving || !name.trim()} style={{
          padding: '12px 0', borderRadius: 999,
          background: saved ? 'var(--pc-sage)' : 'var(--pc-warm)',
          color: saved ? 'var(--pc-sage-ink)' : 'var(--pc-ink)',
          border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1, transition: 'background 0.2s, opacity 0.15s',
        }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
        </button>
      </form>

      {/* Sign out */}
      <button type="button" onClick={signOut} style={{
        padding: '12px 0', borderRadius: 999,
        background: 'transparent', border: '1px solid var(--pc-line-strong)',
        fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
        cursor: 'pointer',
      }}>
        Sign out
      </button>
    </div>
  );
}
