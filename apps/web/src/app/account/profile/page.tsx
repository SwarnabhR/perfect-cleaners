'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Link from 'next/link';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import { toErrMsg } from '@/lib/api-error';
import AccountTabBar from '../AccountTabBar';

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError('');
    try {
      await setDoc(doc(db, 'customers', user.uid), {
        name: name.trim(), email: email.trim(), phone: user.phoneNumber ?? '',
        ...(!hasCreatedAt && { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setHasCreatedAt(true);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(toErrMsg(err, 'Could not save. Please try again.'));
    } finally {
      setSaving(false);
    }
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

        <AccountTabBar pathname={pathname} />

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
              { label: 'Support', sub: 'Track your question or complaint', href: '/account/support' },
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
