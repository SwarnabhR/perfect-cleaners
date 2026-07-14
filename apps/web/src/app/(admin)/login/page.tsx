'use client';
import { useState } from 'react';
import { Suspense } from 'react';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@pc/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/Icon';

function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('from') ?? '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resolve-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Invalid username or password.');
        return;
      }
      await signInWithEmailAndPassword(auth, data.email, password);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const code = (err as AuthError)?.code;
      setError(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found'
          ? 'Invalid username or password.'
          : err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
    borderRadius: 'var(--pc-radius-sm)', color: 'var(--pc-fg)',
    fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--pc-ink)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--pc-radius-sm)',
            background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={16} color="var(--pc-ink)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 16, color: 'var(--pc-fg)', margin: 0 }}>
              Perfect Cleaners
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Admin
            </p>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
          Sign in
        </h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '0 0 32px' }}>
          Operator access only.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="admin-username" style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="admin-password" style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <p role="alert" style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
              padding: '13px 24px', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: 'var(--pc-ink)', opacity: loading ? 0.6 : 1,
              marginTop: 8,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--pc-ink)' }} />}>
      <AdminLoginForm />
    </Suspense>
  );
}
