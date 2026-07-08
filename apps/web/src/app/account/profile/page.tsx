'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  collection, doc, getDoc, setDoc, onSnapshot,
  addDoc, deleteDoc, serverTimestamp, query, where,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import Link from 'next/link';
import Nav from '@/components/marketing/Nav';
import CustomSelect from '@/components/ui/CustomSelect';
import Footer from '@/components/marketing/Footer';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedAddress {
  id:          string;
  societyId:   string;
  societyName: string;
  tower?:      string;
  flatNo:      string;
  garageNo?:   string;
  primary:     boolean;
}

interface SocietyOption {
  id:     string;
  name:   string;
  towers: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, phone }: { name: string; phone: string }) {
  const initials = name.trim()
    ? name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : phone.slice(-2, -1).toUpperCase();
  return (
    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--pc-sage)', border: '2px solid var(--pc-sage-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 24, fontWeight: 600, color: 'var(--pc-sage-ink)', letterSpacing: '-0.02em' }}>{initials}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 16px',
  background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)',
  borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--pc-fg-3)', marginBottom: 8,
};
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 14px',
};

// ─── Add Address Panel ────────────────────────────────────────────────────────

function AddAddressPanel({ uid, onClose }: { uid: string; onClose: () => void }) {
  const [societies,   setSocieties]   = useState<SocietyOption[]>([]);
  const [societyId,   setSocietyId]   = useState('');
  const [tower,       setTower]       = useState('');
  const [flatNo,      setFlatNo]      = useState('');
  const [garageNo,    setGarageNo]    = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'societies'), where('isActive', '==', true));
    return onSnapshot(q, snap => {
      setSocieties(snap.docs.map(d => ({
        id:     d.id,
        name:   d.data().name as string,
        towers: (d.data().towers ?? []) as string[],
      })));
    });
  }, []);

  const selected = societies.find(s => s.id === societyId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!societyId || !flatNo.trim()) return;
    setSaving(true);
    await addDoc(collection(db, 'customers', uid, 'addresses'), {
      societyId,
      societyName: selected?.name ?? '',
      tower:       tower || null,
      flatNo:      flatNo.trim(),
      garageNo:    garageNo.trim() || null,
      primary:     false,
      createdAt:   serverTimestamp(),
    });
    setSaving(false);
    onClose();
  }



  return (
    <div style={{ marginTop: 14, background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: 20 }}>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Society */}
        <div>
          <label style={labelStyle}>Society</label>
          <CustomSelect
            options={societies.map(s => s.name)}
            value={societies.find(s => s.id === societyId)?.name ?? ''}
            placeholder="Select your society…"
            onChange={name => {
              const s = societies.find(s => s.name === name);
              setSocietyId(s?.id ?? '');
              setTower('');
            }}
          />
          {societies.length === 0 && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', marginTop: 6 }}>
              No societies listed yet. Contact us to get yours added.
            </p>
          )}
        </div>

        {/* Tower — only shown if society has towers */}
        {selected && selected.towers.length > 0 && (
          <div>
            <label style={labelStyle}>Tower / Block</label>
            <CustomSelect
              options={selected.towers}
              value={tower}
              placeholder="Select tower…"
              onChange={setTower}
            />
          </div>
        )}

        {/* Flat No */}
        <div>
          <label style={labelStyle}>Flat / Unit number</label>
          <input
            type="text" placeholder="e.g. 1204" value={flatNo}
            onChange={e => setFlatNo(e.target.value)}
            required style={inputStyle}
          />
        </div>

        {/* Garage No */}
        <div>
          <label style={labelStyle}>Garage number <span style={{ color: 'var(--pc-fg-4)', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text" placeholder="e.g. G-42" value={garageNo}
            onChange={e => setGarageNo(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={saving || !societyId || !flatNo.trim()}
            style={{ flex: 1, padding: '12px 0', borderRadius: 999, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, cursor: (saving || !societyId || !flatNo.trim()) ? 'not-allowed' : 'pointer', opacity: (saving || !societyId || !flatNo.trim()) ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Address'}
          </button>
          <button type="button" onClick={onClose} style={{ padding: '12px 20px', borderRadius: 999, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading } = useCustomerAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [fetched,    setFetched]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');
  const [addresses,  setAddresses]  = useState<SavedAddress[]>([]);
  const [addingAddr, setAddingAddr] = useState(false);
  const [hasCreatedAt, setHasCreatedAt] = useState(true);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/signin?from=/account/profile');
  }, [user, loading, router]);

  // Load profile from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'customers', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name ?? ''); setEmail(d.email ?? '');
        setHasCreatedAt(!!d.createdAt);
      } else {
        setHasCreatedAt(false);
      }
      setFetched(true);
    });
  }, [user]);

  // Live addresses
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'customers', user.uid, 'addresses'), snap => {
      setAddresses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedAddress)));
    });
  }, [user?.uid]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError('');
    try {
      await setDoc(doc(db, 'customers', user.uid), {
        id: user.uid, name: name.trim(), email: email.trim(), phone: user.phoneNumber ?? '',
        ...(!hasCreatedAt && { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setHasCreatedAt(true);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function setPrimary(id: string) {
    if (!user) return;
    await Promise.all(addresses.map(a =>
      setDoc(doc(db, 'customers', user.uid, 'addresses', a.id), { primary: a.id === id }, { merge: true }),
    ));
  }

  async function deleteAddr(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'customers', user.uid, 'addresses', id));
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
    </div>
  );
  if (!user || !fetched) return null;

  const phone = user.phoneNumber
    ? `+91 ${user.phoneNumber.replace('+91', '').slice(0, 5)} ${user.phoneNumber.replace('+91', '').slice(5)}`
    : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{ flex: 1, maxWidth: 640, width: '100%', margin: '0 auto', padding: 'var(--pc-space-12) var(--pc-space-6) var(--pc-space-20)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 'var(--pc-space-1)', borderBottom: '1px solid var(--pc-line)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any }}>
          {[
            { label: 'Schedule', href: '/account/cleaning' },
            { label: 'Bookings', href: '/account'          },
            { label: 'Profile',  href: '/account/profile'  },
            { label: 'Bill',     href: '/account/wallet'   },
          ].map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={{ padding: 'var(--pc-space-3) var(--pc-space-4)', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--pc-fg)' : 'var(--pc-fg-3)', textDecoration: 'none', borderBottom: active ? '2px solid var(--pc-fg)' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s ease' }}>
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Avatar + identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-5)' }}>
          <Avatar name={name} phone={user.phoneNumber ?? ''} />
          <div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>{name || 'Your profile'}</p>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)', margin: '4px 0 0', letterSpacing: '0.04em' }}>{phone}</p>
            {email && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>{email}</p>}
          </div>
        </div>

        {/* Personal details form */}
        <section>
          <p style={sectionTitle}>PERSONAL DETAILS</p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input type="text" placeholder="e.g. Rahul Sharma" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email (optional)</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mobile number</label>
              <input type="text" value={phone} readOnly style={{ ...inputStyle, color: 'var(--pc-fg-3)', cursor: 'not-allowed' }} />
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', marginTop: 6 }}>Linked to your account — cannot be changed.</p>
            </div>
            {error && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={saving || !name.trim()} style={{ padding: '13px 0', borderRadius: 999, background: saved ? 'var(--pc-sage)' : 'var(--pc-warm)', color: saved ? 'var(--pc-sage-ink)' : 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'background 0.2s, opacity 0.15s' }}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
            </button>
          </form>
        </section>

        {/* Addresses */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>SAVED ADDRESSES</p>
            <button type="button" onClick={() => setAddingAddr(o => !o)} style={{ padding: '6px 14px', borderRadius: 999, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', cursor: 'pointer' }}>
              {addingAddr ? 'Cancel' : '+ Add address'}
            </button>
          </div>

          {addresses.length === 0 && !addingAddr && (
            <div style={{ padding: '28px 0', textAlign: 'center', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)' }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', margin: 0 }}>No saved addresses yet.</p>
            </div>
          )}

          {addresses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {addresses.map(addr => (
                <div key={addr.id} style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)' }}>
                        Flat {addr.flatNo}{addr.tower ? `, ${addr.tower}` : ''}
                      </span>
                      {addr.primary && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'color-mix(in srgb, var(--pc-sage) 15%, transparent)', border: '1px solid rgba(74,94,68,0.3)', fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-sage-hi)', letterSpacing: '0.06em' }}>PRIMARY</span>}
                    </div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.5 }}>
                      {addr.societyName}
                      {addr.garageNo ? ` · Garage ${addr.garageNo}` : ''}
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
                </div>
              ))}
            </div>
          )}

          {addingAddr && <AddAddressPanel uid={user.uid} onClose={() => setAddingAddr(false)} />}
        </section>

        {/* Account quick links */}
        <section>
          <p style={sectionTitle}>MY ACCOUNT</p>
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden' }}>
            {[
              { label: 'Order History', sub: 'View all your past and upcoming bookings', href: '/account'        },
              { label: 'Your Bill',     sub: 'Outstanding balance and wash history',   href: '/account/wallet' },
            ].map(({ label: lbl, sub, href }, i, arr) => (
              <Link key={lbl} href={href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--pc-line)' : 'none', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>{lbl}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>{sub}</p>
                </div>
                <span style={{ color: 'var(--pc-fg-4)', fontSize: 18, lineHeight: 1 }}>›</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Support */}
        <section>
          <p style={sectionTitle}>SUPPORT</p>
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden' }}>
            {[
              { label: 'Raise a Complaint', sub: 'We respond within 24 hours', href: 'mailto:support@perfectcleaners.in?subject=Customer Complaint' },
              { label: 'Help & FAQ',        sub: 'Find answers to common questions', href: '/faq'     },
              { label: 'Privacy Policy',    sub: '',                                  href: '/privacy' },
              { label: 'Terms of Service',  sub: '',                                  href: '/terms'   },
            ].map(({ label: lbl, sub, href }, i, arr) => (
              <a key={lbl} href={href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--pc-line)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>{lbl}</p>
                  {sub && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>{sub}</p>}
                </div>
                <span style={{ color: 'var(--pc-fg-4)', fontSize: 18, lineHeight: 1 }}>›</span>
              </a>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
