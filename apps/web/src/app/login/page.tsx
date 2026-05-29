'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import Image from 'next/image';
import { auth } from '@pc/firebase';
import OtpInput from '@/components/ui/OtpInput';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import { Metadata } from 'next';

type Step = 'phone' | 'otp';

const SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '';

function FieldLabel({ children }: { children: string }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'var(--pc-mono)',
      fontSize: 10,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--pc-fg-3)',
      marginBottom: 8,
    }}>
      {children}
    </label>
  );
}

function ErrorText({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p style={{
      fontFamily: 'var(--pc-sans)',
      fontSize: 13,
      color: 'var(--pc-danger)',
      marginTop: 8,
    }}>
      {msg}
    </p>
  );
}

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useCustomerAuth();

  const [step,           setStep]           = useState<Step>('phone');
  const [phone,          setPhone]          = useState('');
  const [otp,            setOtp]            = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [busy,           setBusy]           = useState(false);
  const [error,          setError]          = useState('');
  const [countdown,      setCountdown]      = useState(0);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const redirectTo   = searchParams.get('from') ?? '/account';

  // If already signed in, skip login
  useEffect(() => {
    if (!loading && user) router.replace(redirectTo);
  }, [user, loading, redirectTo, router]);

  // Countdown timer for "resend code"
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Please complete the verification check.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send code. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken('');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await signInWithCustomToken(auth, data.token);
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed. Please try again.');
      setOtp('');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setOtp('');
    setError('');
    setStep('phone');
    setTurnstileToken('');
    turnstileRef.current?.reset();
  }

  if (loading) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px',
    background: 'var(--pc-card)',
    border: '1px solid var(--pc-line)',
    borderRadius: 'var(--pc-radius-sm)',
    color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '13px 24px',
    marginTop: 24,
    background: busy ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
    color: 'var(--pc-ink)',
    border: 'none',
    borderRadius: 999,
    fontFamily: 'var(--pc-sans)',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: busy ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s ease',
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--pc-ink)',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Wordmark */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 48,
        }}>
          <Image src="/logo-pc-monogram.svg" width={18} height={22} alt="" aria-hidden />
          <span style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--pc-fg)',
          }}>
            Perfect Cleaners
          </span>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <p style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--pc-fg-3)',
              marginBottom: 12,
            }}>
              [ACCOUNT] / SIGN IN
            </p>
            <h1 style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--pc-fg)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              marginBottom: 32,
            }}>
              Welcome back.
            </h1>

            <FieldLabel>Mobile number</FieldLabel>
            <div style={{ position: 'relative', display: 'flex' }}>
              <span style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 12px 12px 14px',
                background: 'var(--pc-card)',
                border: '1px solid var(--pc-line)',
                borderRight: 'none',
                borderRadius: 'var(--pc-radius-sm) 0 0 var(--pc-radius-sm)',
                fontFamily: 'var(--pc-mono)',
                fontSize: 13,
                color: 'var(--pc-fg-3)',
                userSelect: 'none',
                flexShrink: 0,
              }}>
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                required
                autoFocus
                style={{
                  ...inputStyle,
                  borderRadius: '0 var(--pc-radius-sm) var(--pc-radius-sm) 0',
                  flex: 1,
                }}
              />
            </div>
            <ErrorText msg={error} />

            {/* Turnstile — renders a small non-intrusive badge */}
            <div style={{ marginTop: 20 }}>
              <Turnstile
                ref={turnstileRef}
                siteKey={SITE_KEY}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'dark', size: 'flexible' }}
              />
            </div>

            <button type="submit" disabled={busy || phone.length < 10 || !turnstileToken} style={primaryBtn}>
              {busy ? 'Sending…' : 'Send Code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--pc-fg-3)',
              marginBottom: 12,
            }}>
              [ACCOUNT] / VERIFY
            </p>
            <h1 style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--pc-fg)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              marginBottom: 8,
            }}>
              Enter your code.
            </h1>
            <p style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 13,
              color: 'var(--pc-fg-3)',
              marginBottom: 32,
              lineHeight: 1.5,
            }}>
              Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
            </p>

            <FieldLabel>6-digit code</FieldLabel>
            <OtpInput value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={busy} />
            <ErrorText msg={error} />

            <button
              type="submit"
              disabled={busy || otp.length < 6}
              style={{ ...primaryBtn, marginTop: 24 }}
            >
              {busy ? 'Verifying…' : 'Verify →'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {countdown > 0 ? (
                <span style={{
                  fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
                }}>
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--pc-sans)', fontSize: 13,
                    color: 'var(--pc-fg-2)',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}

        <p style={{
          marginTop: 40,
          fontFamily: 'var(--pc-sans)',
          fontSize: 12,
          color: 'var(--pc-fg-4)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          By signing in you agree to our terms of service and privacy policy.
        </p>
      </div>
    </main>
  );
}
