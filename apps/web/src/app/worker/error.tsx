'use client';

import { useEffect } from 'react';

export default function WorkerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[WorkerError]', error);
  }, [error]);

  return (
    <div style={{
      padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
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
        fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 4vw, 28px)',
        fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 12px',
      }}>
        Something went wrong.
      </h2>
      <p style={{
        fontFamily: 'var(--pc-sans)', fontSize: 13,
        color: 'var(--pc-fg-3)', margin: '0 0 24px', maxWidth: 320, lineHeight: 1.6,
      }}>
        {process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred. Pull down to refresh or restart the app.'}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: '12px 28px', background: 'var(--pc-sage)', color: 'var(--pc-sage-ink)',
          border: 'none', borderRadius: 999, fontFamily: 'var(--pc-sans)', fontSize: 13,
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
