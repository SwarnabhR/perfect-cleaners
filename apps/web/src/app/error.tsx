'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error:  Error & { digest?: string };
  reset:  () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--pc-ink)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '40px 24px',
      fontFamily:     'var(--pc-sans)',
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p style={{
          fontFamily:    'var(--pc-mono)',
          fontSize:       10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'var(--pc-fg-4)',
          margin:        '0 0 16px',
        }}>
          [ERROR]
        </p>

        <h1 style={{
          fontFamily:    'var(--pc-serif)',
          fontSize:      'clamp(32px, 6vw, 52px)',
          fontWeight:     400,
          color:         'var(--pc-fg)',
          letterSpacing: '-0.02em',
          lineHeight:     1.05,
          margin:        '0 0 16px',
        }}>
          Something went wrong.
        </h1>

        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize:    14,
          color:      'var(--pc-fg-3)',
          lineHeight:  1.6,
          margin:     '0 0 32px',
        }}>
          An unexpected error occurred. Try refreshing the page — if the problem persists,
          please{' '}
          <Link href="/contact" style={{ color: 'var(--pc-sage-hi)', textDecoration: 'none' }}>
            contact us
          </Link>
          .
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding:       '11px 28px',
              background:    'var(--pc-warm)',
              color:         'var(--pc-ink)',
              border:        'none',
              borderRadius:   999,
              fontFamily:    'var(--pc-sans)',
              fontSize:       13,
              fontWeight:     600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor:        'pointer',
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              padding:        '11px 24px',
              background:     'transparent',
              color:          'var(--pc-fg-3)',
              border:         '1px solid var(--pc-line-strong)',
              borderRadius:    999,
              fontFamily:     'var(--pc-sans)',
              fontSize:        13,
              letterSpacing:  '0.04em',
              textDecoration: 'none',
              display:        'inline-flex',
              alignItems:     'center',
            }}
          >
            Go home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <pre style={{
            marginTop:    32,
            padding:      '12px 16px',
            background:   'var(--pc-card)',
            border:       '1px solid var(--pc-line)',
            borderRadius: 6,
            fontFamily:   'var(--pc-mono)',
            fontSize:     11,
            color:        'var(--pc-danger)',
            textAlign:    'left',
            overflowX:    'auto',
            whiteSpace:   'pre-wrap',
            wordBreak:    'break-all',
          }}>
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
        )}
      </div>
    </div>
  );
}
