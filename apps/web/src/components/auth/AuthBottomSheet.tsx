'use client';

import { useEffect, useRef, useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@pc/firebase';
import OtpInput from '@/components/ui/OtpInput';
import { useMsg91 } from '@/lib/auth/useMsg91';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthBottomSheetProps {
  open:       boolean;
  onClose:    () => void;
  onSuccess?: (uid: string) => void;
  /** Contextual headline shown above the form, e.g. "Sign in to book" */
  heading?:   string;
}

type Step = 'phone' | 'otp' | 'profile';

// ─── Sub-atoms ────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return (
    <label style={{
      display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--pc-fg-3)', marginBottom: 8,
    }}>
      {children}
    </label>
  );
}

function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', marginTop: 8, lineHeight: 1.5 }}>{msg}</p>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthBottomSheet({ open, onClose, onSuccess, heading }: AuthBottomSheetProps) {
  const { ready } = useMsg91();

  const [step,      setStep]      = useState<Step>('phone');
  const [phone,     setPhone]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [uid,       setUid]       = useState('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) { setStep('phone'); setPhone(''); setOtp(''); setFirstName(''); setLastName(''); setEmail(''); setUid(''); setError(''); setBusy(false); setCountdown(0); }
  }, [open]);

  // Body scroll lock while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !window.sendOtp) {
      setError('Verification service is loading. Please wait a moment and try again.');
      return;
    }
    setError(''); setBusy(true);
    window.sendOtp(
      `91${phone}`,
      ()         => { setBusy(false); setStep('otp'); setCountdown(60); },
      (err: any) => { setBusy(false); setError(err?.message ?? 'Failed to send code. Please try again.'); },
    );
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 4 || !window.verifyOtp) return;
    setError(''); setBusy(true);
    window.verifyOtp(
      otp,
      async (data: any) => {
        // Msg91 SDK puts the access token in different fields across versions:
        // v1: data['access-token'], v2: data.token, v3: data.message (confusingly)
        const msg91Token =
          typeof data === 'string'
            ? data
            : (data?.['access-token'] ?? data?.accessToken ?? data?.token ?? data?.message);
        if (!msg91Token) {
          console.error('[Auth] verifyOtp unexpected data shape:', JSON.stringify(data));
          setError('Verification failed. Please try again.');
          setBusy(false); return;
        }
        try {
          const res  = await fetch('/api/auth/verify-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, msg91Token }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          const cred = await signInWithCustomToken(auth, json.token);

          // New user → collect profile before proceeding
          const snap = await getDoc(doc(db, 'customers', cred.user.uid));
          if (snap.exists() && snap.data().name) {
            onSuccess?.(cred.user.uid);
            onClose();
          } else {
            setUid(cred.user.uid);
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

  function handleResend() {
    if (countdown > 0 || !window.retryOtp) return;
    setOtp(''); setError('');
    window.retryOtp(null,
      ()         => setCountdown(60),
      (err: any) => setError(err?.message ?? 'Could not resend.'),
    );
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    const trimFirst = firstName.trim();
    const trimLast  = lastName.trim();
    const trimEmail = email.trim();
    if (!trimFirst || !trimLast) { setError('Name is required.'); return; }
    if (trimEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) { setError('Enter a valid email address.'); return; }
    setError(''); setBusy(true);
    try {
      await setDoc(doc(db, 'customers', uid), {
        name:      `${trimFirst} ${trimLast}`,
        ...(trimEmail && { email: trimEmail }),
        phone:     `+91${phone}`,
        vehicles:  [],
        createdAt: serverTimestamp(),
      }, { merge: true });
      onSuccess?.(uid);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save profile. Please try again.');
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: 'var(--pc-ink-raised)', border: '1px solid var(--pc-line-strong)',
    borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%', marginTop: 20, padding: '14px 24px',
    background: (busy || (step === 'phone' && phone.length < 10) || (step === 'otp' && otp.length < 4))
      ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
    color: 'var(--pc-ink)', border: 'none', borderRadius: 999,
    fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    cursor: 'pointer', transition: 'background 0.15s ease',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,9,8,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to continue"
        style={isDesktop ? {
          position: 'fixed',
          top: '50%', left: '50%',
          transform: open ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.96)',
          zIndex: 201,
          width: 460,
          background: 'var(--pc-ink-raised)',
          border: '1px solid var(--pc-line-strong)',
          borderRadius: 'var(--pc-radius-md)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
          overflowY: 'auto',
          maxHeight: '90dvh',
        } : {
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 201,
          background: 'var(--pc-ink-raised)',
          borderTop: '1px solid var(--pc-line-strong)',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 env(safe-area-inset-bottom)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
      >
        {/* Handle — mobile only */}
        {!isDesktop && <div style={{
          width: 40, height: 4, borderRadius: 999,
          background: 'var(--pc-line-strong)',
          margin: '12px auto 0',
        }} />}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--pc-fg-3)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Content */}
        <div style={{ padding: isDesktop ? '32px 32px 36px' : '20px 24px 32px' }}>
          {/* Heading */}
          <p style={{
            fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 10,
          }}>
            {step === 'phone' ? '[ACCOUNT] / SIGN IN OR CREATE' : step === 'otp' ? '[ACCOUNT] / VERIFY' : '[ACCOUNT] / CREATE PROFILE'}
          </p>
          <h2 style={{
            fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 400, color: 'var(--pc-fg)',
            letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: heading ? 8 : 20,
          }}>
            {step === 'phone' ? 'Sign in or create account.' : step === 'otp' ? 'Enter your code.' : 'One last step.'}
          </h2>
          {heading && step === 'phone' && (
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
              marginBottom: 20, lineHeight: 1.5,
            }}>
              {heading}
            </p>
          )}
          {step === 'otp' && (
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
              marginBottom: 20, lineHeight: 1.5,
            }}>
              Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
            </p>
          )}
          {step === 'profile' && (
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
              marginBottom: 20, lineHeight: 1.5,
            }}>
              Tell us your name to complete your account.
            </p>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendCode}>
              <FieldLabel>Mobile number</FieldLabel>
              <div style={{ display: 'flex' }}>
                <span style={{
                  display: 'flex', alignItems: 'center',
                  padding: '12px 12px 12px 14px',
                  background: 'var(--pc-ink-raised)',
                  border: '1px solid var(--pc-line-strong)', borderRight: 'none',
                  borderRadius: 'var(--pc-radius-sm) 0 0 var(--pc-radius-sm)',
                  fontFamily: 'var(--pc-mono)', fontSize: 13,
                  color: 'var(--pc-fg-3)', flexShrink: 0, userSelect: 'none',
                }}>+91</span>
                <input
                  type="tel" inputMode="numeric" maxLength={10}
                  placeholder="98765 43210" value={phone} autoFocus
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                  style={{ ...inputStyle, borderRadius: '0 var(--pc-radius-sm) var(--pc-radius-sm) 0', flex: 1 }}
                />
              </div>
              <Err msg={error} />
              <button type="submit" disabled={busy || phone.length < 10 || !ready} style={primaryBtn}>
                {busy ? 'Sending…' : !ready ? 'Loading…' : 'Send Code →'}
              </button>
              <p style={{
                fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)',
                textAlign: 'center', marginTop: 14, lineHeight: 1.5,
              }}>
                No password. New users are registered automatically.
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify}>
              <FieldLabel>4-digit code</FieldLabel>
              <OtpInput length={4} value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={busy} />
              <Err msg={error} />
              <button type="submit" disabled={busy || otp.length < 4} style={primaryBtn}>
                {busy ? 'Verifying…' : 'Verify & Continue →'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                {countdown > 0 ? (
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button type="button" onClick={handleResend} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
                    textDecoration: 'underline', textUnderlineOffset: 3,
                  }}>Resend code</button>
                )}
                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}>Change number</button>
              </div>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleProfile}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>First name</FieldLabel>
                  <input
                    type="text" autoComplete="given-name" autoFocus
                    placeholder="Rahul" value={firstName}
                    onChange={e => { setFirstName(e.target.value); setError(''); }}
                    required style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Last name</FieldLabel>
                  <input
                    type="text" autoComplete="family-name"
                    placeholder="Sharma" value={lastName}
                    onChange={e => { setLastName(e.target.value); setError(''); }}
                    required style={inputStyle}
                  />
                </div>
              </div>
              <FieldLabel>Email address</FieldLabel>
              <input
                type="email" autoComplete="email" inputMode="email"
                placeholder="rahul@example.com (optional)" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <Err msg={error} />
              <button
                type="submit"
                disabled={busy || !firstName.trim() || !lastName.trim()}
                style={primaryBtn}
              >
                {busy ? 'Saving…' : 'Create Account →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
