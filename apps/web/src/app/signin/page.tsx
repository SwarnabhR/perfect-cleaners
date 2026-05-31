'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import LogoMark from '@/components/ui/LogoMark';
import { auth, db } from '@pc/firebase';
import OtpInput from '@/components/ui/OtpInput';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import { useMsg91 } from '@/lib/auth/useMsg91';

type Step = 'phone' | 'otp' | 'profile';

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'var(--pc-mono)', fontSize: 10,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--pc-fg-3)', marginBottom: 8,
    }}>
      {children}
    </label>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p style={{
      fontFamily: 'var(--pc-sans)', fontSize: 13,
      color: 'var(--pc-danger)', marginTop: 8, lineHeight: 1.5,
    }}>
      {msg}
    </p>
  );
}

// ─── Inner component — uses useSearchParams, must be inside Suspense ─────────

function SignInContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useCustomerAuth();

  const [step,      setStep]      = useState<Step>('phone');
  const [phone,     setPhone]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);

  const { ready }  = useMsg91();
  const redirectTo = searchParams.get('from') ?? '/account';

  // Skip login if already signed in (and profile is complete)
  useEffect(() => {
    if (!loading && user && step !== 'profile') router.replace(redirectTo);
  }, [user, loading, redirectTo, router, step]);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !window.sendOtp) { setError('Verification service is loading. Please wait and try again.'); return; }
    setError(''); setBusy(true);
    window.sendOtp(
      `91${phone}`,
      ()         => { setStep('otp'); setCountdown(60); setBusy(false); },
      (err: any) => { setError(err?.message ?? 'Failed to send code.'); setBusy(false); },
    );
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 4 || !window.verifyOtp) return;
    setError(''); setBusy(true);
    window.verifyOtp(
      otp,
      async (data: any) => {
        const msg91Token = data?.['access-token'] ?? data?.token;
        if (!msg91Token) { setError('No token returned. Please try again.'); setBusy(false); return; }
        try {
          const res  = await fetch('/api/auth/verify-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, msg91Token }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          const cred = await signInWithCustomToken(auth, json.token);

          // Check if customer doc already exists with name + email
          const snap = await getDoc(doc(db, 'customers', cred.user.uid));
          if (snap.exists() && snap.data().name && snap.data().email) {
            router.replace(redirectTo);
          } else {
            setBusy(false);
            setStep('profile');
          }
        } catch (err: any) {
          setError(err?.message ?? 'Sign-in failed. Please try again.');
          setBusy(false);
        }
      },
      (err: any) => { setError(err?.message ?? 'Incorrect code.'); setOtp(''); setBusy(false); },
    );
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const trimFirst = firstName.trim();
    const trimLast  = lastName.trim();
    const trimEmail = email.trim();
    if (!trimFirst || !trimLast || !trimEmail) { setError('All fields are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) { setError('Enter a valid email address.'); return; }
    setError(''); setBusy(true);
    try {
      await setDoc(doc(db, 'customers', user.uid), {
        name:      `${trimFirst} ${trimLast}`,
        email:     trimEmail,
        phone:     `+91${phone}`,
        vehicles:  [],
        createdAt: serverTimestamp(),
      }, { merge: true });
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save profile. Please try again.');
      setBusy(false);
    }
  }

  function handleResend() {
    if (countdown > 0 || !window.retryOtp) return;
    setOtp(''); setError('');
    window.retryOtp(null,
      ()         => setCountdown(60),
      (err: any) => setError(err?.message ?? 'Could not resend.'),
    );
  }

  if (loading) return null;

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
    borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%', marginTop: 24, padding: '13px 24px',
    background: busy ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
    color: 'var(--pc-ink)', border: 'none', borderRadius: 999,
    fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    cursor: busy ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s ease',
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--pc-ink)', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <LogoMark width={18} height={22} color="var(--pc-fg)" />
          <span style={{
            fontFamily: 'var(--pc-mono)', fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--pc-fg)',
          }}>
            Perfect Cleaners
          </span>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendCode}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 12 }}>
              [ACCOUNT] / SIGN IN OR CREATE
            </p>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 10 }}>
              Sign in or create{' '}account.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginBottom: 28, lineHeight: 1.6 }}>
              Enter your mobile number. We'll send a one-time code — no password needed. New here? Your account is created automatically.
            </p>

            <FieldLabel>Mobile number</FieldLabel>
            <div style={{ display: 'flex' }}>
              <span style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 12px 12px 14px',
                background: 'var(--pc-card)',
                border: '1px solid var(--pc-line)', borderRight: 'none',
                borderRadius: 'var(--pc-radius-sm) 0 0 var(--pc-radius-sm)',
                fontFamily: 'var(--pc-mono)', fontSize: 13,
                color: 'var(--pc-fg-3)', userSelect: 'none', flexShrink: 0,
              }}>+91</span>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                placeholder="98765 43210" value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                required autoFocus
                style={{ ...inputBase, borderRadius: '0 var(--pc-radius-sm) var(--pc-radius-sm) 0', flex: 1 }}
              />
            </div>
            <ErrorMsg msg={error} />
            <button type="submit" disabled={busy || phone.length < 10 || !ready} style={primaryBtn}>
              {busy ? 'Sending…' : !ready ? 'Loading…' : 'Send Code →'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 12 }}>
              [ACCOUNT] / VERIFY
            </p>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 8 }}>
              Enter your code.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginBottom: 32, lineHeight: 1.5 }}>
              Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
            </p>

            <FieldLabel>4-digit code</FieldLabel>
            <OtpInput length={4} value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={busy} />
            <ErrorMsg msg={error} />

            <button type="submit" disabled={busy || otp.length < 4} style={primaryBtn}>
              {busy ? 'Verifying…' : 'Verify →'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {countdown > 0 ? (
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                  Resend in {countdown}s
                </span>
              ) : (
                <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Resend code
                </button>
              )}
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', marginLeft: 20, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Change number
              </button>
            </div>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfile}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 12 }}>
              [ACCOUNT] / CREATE PROFILE
            </p>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 10 }}>
              One last step.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginBottom: 28, lineHeight: 1.6 }}>
              Tell us your name and email to complete your account.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>First name</FieldLabel>
                <input
                  type="text" autoComplete="given-name" autoFocus
                  placeholder="Rahul" value={firstName}
                  onChange={e => { setFirstName(e.target.value); setError(''); }}
                  required style={inputBase}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Last name</FieldLabel>
                <input
                  type="text" autoComplete="family-name"
                  placeholder="Sharma" value={lastName}
                  onChange={e => { setLastName(e.target.value); setError(''); }}
                  required style={inputBase}
                />
              </div>
            </div>

            <FieldLabel>Email address</FieldLabel>
            <input
              type="email" autoComplete="email" inputMode="email"
              placeholder="rahul@example.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required style={{ ...inputBase, marginBottom: 0 }}
            />

            <ErrorMsg msg={error} />
            <button
              type="submit"
              disabled={busy || !firstName.trim() || !lastName.trim() || !email.trim()}
              style={primaryBtn}
            >
              {busy ? 'Saving…' : 'Create Account →'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 40, fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', textAlign: 'center', lineHeight: 1.6 }}>
          By signing in you agree to our terms of service and privacy policy.
        </p>
      </div>
    </main>
  );
}

// ─── Page export — Suspense required for useSearchParams with Turbopack ───────

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
