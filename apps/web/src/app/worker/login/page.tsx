'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@pc/firebase';
import { useMsg91 } from '@/lib/auth/useMsg91';
import OtpInput from '@/components/ui/OtpInput';
import Icon from '@/components/ui/Icon';

type Step = 'phone' | 'otp';

export default function WorkerLoginPage() {
  const router = useRouter();
  const { ready } = useMsg91();

  const [step,      setStep]      = useState<Step>('phone');
  const [phone,     setPhone]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !window.sendOtp) { setError('Verification service is loading. Please wait and try again.'); return; }
    setError(''); setBusy(true);
    window.sendOtp(
      `91${phone}`,
      () => { setBusy(false); setStep('otp'); setCountdown(60); },
      (err: any) => { setBusy(false); setError(err?.message ?? 'Failed to send code.'); },
    );
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 4 || !window.verifyOtp) return;
    setError(''); setBusy(true);
    window.verifyOtp(
      otp,
      async (data: any) => {
        const msg91Token = data?.['access-token'] ?? data?.token;
        if (!msg91Token) { setError('Verification failed.'); setBusy(false); return; }
        try {
          const res  = await fetch('/api/auth/verify-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, msg91Token }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          const cred = await signInWithCustomToken(auth, json.token);

          // Check this phone is a registered worker
          const snap = await getDoc(doc(db, 'workers', cred.user.uid));
          if (!snap.exists()) {
            await auth.signOut();
            setError('This number is not registered as a worker. Contact your manager.');
            setBusy(false);
            return;
          }
          router.replace('/worker/dashboard');
        } catch (err: any) {
          setError(err?.message ?? 'Sign-in failed.');
          setBusy(false);
        }
      },
      (err: any) => { setError(err?.message ?? 'Incorrect code.'); setOtp(''); setBusy(false); },
    );
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)',
    borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)', fontSize: 15, outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--pc-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--pc-sage)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="hard-hat" size={18} color="var(--pc-sage-ink)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)' }}>
              Perfect Cleaners
            </div>
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', letterSpacing: '0.12em' }}>
              WORKER PORTAL
            </div>
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSend}>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              Worker sign in.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 28px', lineHeight: 1.6 }}>
              Enter your registered mobile number to access your jobs and earnings.
            </p>
            <label style={{ display: 'block', fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 8 }}>
              Mobile number
            </label>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 12px 14px', background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)', borderRight: 'none', borderRadius: 'var(--pc-radius-sm) 0 0 var(--pc-radius-sm)', fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg-3)', flexShrink: 0 }}>
                +91
              </span>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                placeholder="98765 43210" value={phone} autoFocus
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                required
                style={{ ...inp, borderRadius: '0 var(--pc-radius-sm) var(--pc-radius-sm) 0', flex: 1 }}
              />
            </div>
            {error && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', marginTop: 8 }}>{error}</p>}
            <button type="submit" disabled={busy || phone.length < 10 || !ready} style={{
              width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 999,
              background: (busy || phone.length < 10 || !ready) ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
              color: 'var(--pc-ink)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: (busy || phone.length < 10 || !ready) ? 'not-allowed' : 'pointer',
            }}>
              {busy ? 'Sending…' : !ready ? 'Loading…' : 'Send Code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              Enter your code.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 28px' }}>
              Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
            </p>
            <OtpInput length={4} value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={busy} />
            {error && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', marginTop: 8 }}>{error}</p>}
            <button type="submit" disabled={busy || otp.length < 4} style={{
              width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 999,
              background: (busy || otp.length < 4) ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
              color: 'var(--pc-ink)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: (busy || otp.length < 4) ? 'not-allowed' : 'pointer',
            }}>
              {busy ? 'Verifying…' : 'Verify →'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
              {countdown > 0 ? (
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Resend in {countdown}s</span>
              ) : (
                <button type="button" onClick={() => { window.retryOtp?.(null, () => setCountdown(60), () => {}); setOtp(''); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Resend
                </button>
              )}
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Change number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
