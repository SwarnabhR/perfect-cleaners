'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name:  string;
  email: string;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, phone }: { name: string; phone: string }) {
  const initials = name.trim()
    ? name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : phone.slice(-2, -1).toUpperCase();

  return (
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: 'var(--pc-sage)',
      border: '2px solid var(--pc-sage-hi)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'var(--pc-sans)', fontSize: 28, fontWeight: 600,
        color: 'var(--pc-sage-ink)', letterSpacing: '-0.02em',
      }}>
        {initials}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading } = useCustomerAuth();
  const router = useRouter();

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [fetched, setFetched] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/signin?from=/account/profile');
  }, [user, loading, router]);

  // Load existing profile from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'customers', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name  ?? '');
        setEmail(d.email ?? '');
      }
      setFetched(true);
    });
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError('');
    try {
      await setDoc(
        doc(db, 'customers', user.uid),
        {
          id:        user.uid,
          name:      name.trim(),
          email:     email.trim(),
          phone:     user.phoneNumber ?? '',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || !fetched) return null;

  const phone = user.phoneNumber
    ? `+91 ${user.phoneNumber.replace('+91', '').slice(0, 5)} ${user.phoneNumber.replace('+91', '').slice(5)}`
    : '';

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 16px',
    background: 'var(--pc-card)',
    border: '1px solid var(--pc-line-strong)',
    borderRadius: 'var(--pc-radius-sm)',
    color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)', fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--pc-mono)', fontSize: 10,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--pc-fg-3)', marginBottom: 8,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{
        flex: 1, maxWidth: 560, width: '100%',
        margin: '0 auto',
        padding: 'var(--pc-space-12) var(--pc-space-6) var(--pc-space-20)',
      }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 'var(--pc-space-1)',
          marginBottom: 'var(--pc-space-10)',
          borderBottom: '1px solid var(--pc-line)',
          paddingBottom: 0,
        }}>
          {[
            { label: 'Bookings', href: '/account'         },
            { label: 'Profile',  href: '/account/profile' },
          ].map(tab => {
            const active = tab.href === '/account/profile';
            return (
              <a
                key={tab.href}
                href={tab.href}
                style={{
                  padding: 'var(--pc-space-3) var(--pc-space-4)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
                  textDecoration: 'none',
                  borderBottom: active ? '2px solid var(--pc-fg)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.15s ease',
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </div>

        {/* Avatar + phone */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--pc-space-5)',
          marginBottom: 'var(--pc-space-10)',
        }}>
          <Avatar name={name} phone={user.phoneNumber ?? ''} />
          <div>
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 18, fontWeight: 500,
              color: 'var(--pc-fg)', margin: 0,
            }}>
              {name || 'Your profile'}
            </p>
            <p style={{
              fontFamily: 'var(--pc-mono)', fontSize: 12,
              color: 'var(--pc-fg-3)', margin: '4px 0 0',
              letterSpacing: '0.04em',
            }}>
              {phone}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email (optional)</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Mobile number</label>
            <input
              type="text"
              value={phone}
              readOnly
              style={{ ...inputStyle, color: 'var(--pc-fg-3)', cursor: 'not-allowed' }}
            />
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 12,
              color: 'var(--pc-fg-4)', marginTop: 6,
            }}>
              Phone number is linked to your account and cannot be changed.
            </p>
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            style={{
              padding: '13px 0', borderRadius: 999,
              background: saved ? 'var(--pc-sage)' : 'var(--pc-warm)',
              color: saved ? 'var(--pc-sage-ink)' : 'var(--pc-ink)',
              border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background 0.2s, opacity 0.15s',
            }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
