'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError]', error);
  }, [error]);

  return (
    <div style={{
      padding: 'var(--pc-space-20) var(--pc-space-10)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', minHeight: 400,
    }}>
      <p style={{
        fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)',
        textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px',
      }}>
        [ERROR]
      </p>
      <h2 style={{
        fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)',
        fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 12px',
      }}>
        Something went wrong.
      </h2>
      <p style={{
        fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
        color: 'var(--pc-fg-3)', margin: '0 0 24px', maxWidth: 360, lineHeight: 1.6,
      }}>
        {process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred. Try refreshing or contact support.'}
      </p>
      {error.digest && process.env.NODE_ENV === 'development' && (
        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '0 0 20px' }}>
          Digest: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        style={{
          padding: '10px 24px', background: 'var(--pc-warm)', color: 'var(--pc-ink)',
          border: 'none', borderRadius: 999, fontFamily: 'var(--pc-sans)', fontSize: 13,
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
