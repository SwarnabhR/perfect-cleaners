'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';

type Platform = 'android' | 'ios' | 'both';

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'android', label: 'Android' },
  { id: 'ios',     label: 'iOS'     },
  { id: 'both',    label: 'Both'    },
];

export default function AppWaitlistForm() {
  const [phone,    setPhone]    = useState('');
  const [platform, setPlatform] = useState<Platform>('both');
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError(''); setBusy(true);
    try {
      await addDoc(collection(db, 'appWaitlist'), {
        phone:     `+91${phone}`,
        platform,
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px',
        background: 'rgba(74,94,68,0.12)',
        border: '1px solid var(--pc-sage-hi)',
        borderRadius: 'var(--pc-radius-md)',
        maxWidth: 460,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="var(--pc-sage-hi)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', margin: 0 }}>
          You're on the list. We'll notify you on <strong style={{ color: 'var(--pc-fg)' }}>+91 {phone.slice(0,5)} {phone.slice(5)}</strong> when the app is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
      <p style={{
        fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 12,
      }}>
        [NOTIFY ME] / GET EARLY ACCESS
      </p>

      {/* Platform toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--pc-radius-pill)',
              border: `1px solid ${platform === p.id ? 'var(--pc-sage-hi)' : 'var(--pc-line-strong)'}`,
              background: platform === p.id ? 'var(--pc-sage-subtle)' : 'transparent',
              color: platform === p.id ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg-3)',
              fontFamily: 'var(--pc-mono)', fontSize: 10.5, letterSpacing: '0.06em',
              textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Phone input + submit */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <span style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 12px 12px 14px',
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line-strong)', borderRight: 'none',
            borderRadius: 'var(--pc-radius-sm) 0 0 var(--pc-radius-sm)',
            fontFamily: 'var(--pc-mono)', fontSize: 13,
            color: 'var(--pc-fg-3)', userSelect: 'none', flexShrink: 0,
          }}>+91</span>
          <input
            type="tel" inputMode="numeric" maxLength={10}
            placeholder="98765 43210" value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
            style={{
              flex: 1, padding: '12px 14px', boxSizing: 'border-box',
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line-strong)',
              borderRadius: '0 var(--pc-radius-sm) var(--pc-radius-sm) 0',
              color: 'var(--pc-fg)',
              fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={busy || phone.length < 10}
          style={{
            padding: '0 22px',
            background: (busy || phone.length < 10) ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
            color: 'var(--pc-ink)',
            border: 'none', borderRadius: 'var(--pc-radius-sm)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: (busy || phone.length < 10) ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s ease',
          }}
        >
          {busy ? '…' : 'Notify me'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)', marginTop: 8 }}>
          {error}
        </p>
      )}
    </form>
  );
}
