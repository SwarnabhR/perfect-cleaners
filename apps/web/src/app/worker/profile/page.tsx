'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import { useWorkerAuth } from '@/components/WorkerAuthProvider';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

// ─── Address types ────────────────────────────────────────────────────────────

interface SavedAddress {
  id:      string;
  label:   string;
  line1:   string;
  line2:   string;
  city:    string;
  pincode: string;
  primary: boolean;
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 16px',
  background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)',
  borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
};
const label: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--pc-fg-3)', marginBottom: 8,
};

// ─── Add Address Modal ────────────────────────────────────────────────────────

function AddAddressModal({ uid, onClose }: { uid: string; onClose: () => void }) {
  const [line1,   setLine1]   = useState('');
  const [line2,   setLine2]   = useState('');
  const [city,    setCity]    = useState('Ghaziabad');
  const [pincode, setPincode] = useState('');
  const [lbl,     setLbl]     = useState('Home');
  const [saving,  setSaving]  = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!line1.trim()) return;
    setSaving(true);
    await addDoc(collection(db, 'workers', uid, 'addresses'), {
      label:   lbl.trim() || 'Home',
      line1:   line1.trim(),
      line2:   line2.trim(),
      city:    city.trim() || 'Ghaziabad',
      pincode: pincode.trim(),
      primary: false,
      createdAt: serverTimestamp(),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--pc-ink-raised)', borderTopLeftRadius: 20, borderTopRightRadius: 20, border: '1px solid var(--pc-line-strong)', padding: '24px 20px 40px', width: '100%', maxWidth: 540, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)' }}>Add Address</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-3)' }}>
            <Icon name="x" size={18} color="currentColor" />
          </button>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { lbl: 'Label', val: lbl,     set: setLbl,     ph: 'Home, Site, etc.' },
            { lbl: 'Address Line 1', val: line1, set: setLine1, ph: 'House / building / street' },
            { lbl: 'Address Line 2', val: line2, set: setLine2, ph: 'Landmark, sector (optional)' },
            { lbl: 'City',    val: city,    set: setCity,    ph: 'Ghaziabad' },
            { lbl: 'Pincode', val: pincode, set: setPincode, ph: '201002' },
          ].map(({ lbl: l, val, set, ph }) => (
            <div key={l}>
              <label style={label}>{l}</label>
              <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} />
            </div>
          ))}
          <button type="submit" disabled={saving || !line1.trim()} style={{ padding: '13px 0', borderRadius: 999, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkerProfilePage() {
  const { user, worker, signOut } = useWorkerAuth();
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [addresses,   setAddresses]   = useState<SavedAddress[]>([]);
  const [addAddrOpen, setAddAddrOpen] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (worker) setName(worker.name ?? ''); }, [worker]);

  // Live addresses
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'workers', user.uid, 'addresses'), snap => {
      setAddresses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedAddress)));
    });
  }, [user?.uid]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    await setDoc(doc(db, 'workers', user.uid), { name: name.trim(), email: email.trim(), updatedAt: serverTimestamp() }, { merge: true });
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  async function setPrimary(id: string) {
    if (!user) return;
    const col = collection(db, 'workers', user.uid, 'addresses');
    await Promise.all(addresses.map(a =>
      setDoc(doc(col, a.id), { primary: a.id === id }, { merge: true }),
    ));
  }

  async function deleteAddr(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'workers', user.uid, 'addresses', id));
  }

  const initials = (worker?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const phone    = user?.phoneNumber?.replace('+91', '') ?? '';

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
          { icon: 'briefcase',    label: 'Total Jobs',  value: worker?.totalJobs ?? 0 },
          { icon: 'star',         label: 'Rating',      value: (worker?.rating ?? 0).toFixed(1) },
          { icon: 'indian-rupee', label: 'This Month',  value: `₹${(worker?.earnings?.month ?? 0).toLocaleString('en-IN')}` },
        ].map(({ icon, label: lbl, value }) => (
          <Card key={lbl} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
            <Icon name={icon} size={15} color="var(--pc-fg-3)" style={{ margin: '0 auto' }} />
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lbl}</p>
          </Card>
        ))}
      </div>

      {/* Edit profile */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
        <div>
          <label style={label}>Full name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
        </div>
        <div>
          <label style={label}>Email (optional)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
        </div>
        <div>
          <label style={label}>Mobile number</label>
          <input type="text" value={`+91 ${phone.slice(0, 5)} ${phone.slice(5)}`} readOnly style={{ ...inp, color: 'var(--pc-fg-3)', cursor: 'not-allowed' }} />
        </div>
        <button type="submit" disabled={saving || !name.trim()} style={{ padding: '12px 0', borderRadius: 999, background: saved ? 'var(--pc-sage)' : 'var(--pc-warm)', color: saved ? 'var(--pc-sage-ink)' : 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'background 0.2s, opacity 0.15s' }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
        </button>
      </form>

      {/* Addresses */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Eyebrow>SAVED ADDRESSES</Eyebrow>
          <button type="button" onClick={() => setAddAddrOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', cursor: 'pointer' }}>
            <Icon name="plus" size={13} color="currentColor" /> Add
          </button>
        </div>
        {addresses.length === 0 ? (
          <Card style={{ padding: 'var(--pc-space-6)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', margin: 0 }}>No saved addresses yet.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {addresses.map(addr => (
              <Card key={addr.id} style={{ padding: 'var(--pc-space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>{addr.label}</p>
                    {addr.primary && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--pc-sage-subtle)', fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-sage-hi)', letterSpacing: '0.06em' }}>PRIMARY</span>}
                  </div>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.5 }}>
                    {[addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!addr.primary && (
                    <button type="button" onClick={() => setPrimary(addr.id)} style={{ padding: '5px 10px', borderRadius: 6, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', cursor: 'pointer' }}>
                      Set primary
                    </button>
                  )}
                  <button type="button" onClick={() => deleteAddr(addr.id)} style={{ padding: '5px 10px', borderRadius: 6, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-danger)', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Support */}
      <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
        <Eyebrow>SUPPORT</Eyebrow>
        {[
          { icon: 'message-circle', label: 'Raise a complaint',   href: 'mailto:support@perfectcleaners.in?subject=Worker Complaint' },
          { icon: 'file-text',      label: 'Privacy Policy',      href: 'https://perfectcleaners.in/privacy' },
          { icon: 'book-open',      label: 'Terms of Service',    href: 'https://perfectcleaners.in/terms' },
        ].map(({ icon, label: lbl, href }) => (
          <a key={lbl} href={href} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--pc-line-faint)', textDecoration: 'none', color: 'var(--pc-fg-2)' }}>
            <Icon name={icon} size={14} color="var(--pc-fg-4)" />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14 }}>{lbl}</span>
            <Icon name="external-link" size={12} color="var(--pc-fg-4)" style={{ marginLeft: 'auto' }} />
          </a>
        ))}
      </Card>

      {/* Sign out */}
      <button type="button" onClick={signOut} style={{ padding: '12px 0', borderRadius: 999, background: 'transparent', border: '1px solid var(--pc-line-strong)', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', cursor: 'pointer' }}>
        Sign out
      </button>

      {addAddrOpen && user && <AddAddressModal uid={user.uid} onClose={() => setAddAddrOpen(false)} />}
    </div>
  );
}
