import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * /account — placeholder page.
 *
 * Firebase Auth is not yet wired end-to-end. Once auth is live, replace
 * this page with a proper auth-gated profile/orders view. For now it
 * gives users a clear landing instead of a 404, and provides the Book
 * Now CTA so the session isn't a dead end.
 */
export default function AccountPage() {
  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--pc-space-20) var(--pc-space-6)',
      textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 'var(--pc-radius-pill)',
        border: '1px solid var(--pc-line-strong)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--pc-space-8)',
      }}>
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--pc-fg-3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-3)' }}>
        ACCOUNT
      </Eyebrow>

      <h1 style={{
        fontFamily: 'var(--pc-serif)',
        fontSize: 'var(--pc-text-2xl)',
        fontWeight: 400,
        color: 'var(--pc-fg)',
        letterSpacing: 'var(--pc-track-tight)',
        lineHeight: 'var(--pc-lh-tight)',
        marginBottom: 'var(--pc-space-4)',
      }}>
        Coming soon.
      </h1>

      <p style={{
        fontFamily: 'var(--pc-sans)',
        fontSize: 'var(--pc-text-base)',
        color: 'var(--pc-fg-2)',
        lineHeight: 'var(--pc-lh-loose)',
        maxWidth: 360,
        marginBottom: 'var(--pc-space-10)',
      }}>
        Customer accounts — booking history, saved addresses, and subscription
        management — are on their way. For now, all booking confirmations are
        sent via WhatsApp.
      </p>

      <div style={{ display: 'flex', gap: 'var(--pc-space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/book"
          className="pc-hero-cta-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--pc-space-3) var(--pc-space-8)',
            borderRadius: 'var(--pc-radius-pill)',
            background: 'var(--pc-warm)',
            color: 'var(--pc-ink)',
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-sm)',
            fontWeight: 600,
            letterSpacing: 'var(--pc-track-wide)',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background var(--pc-dur-fast) var(--pc-ease)',
          }}
        >
          Book a Service →
        </Link>
        <Link
          href="/"
          className="pc-hero-cta-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--pc-space-3) var(--pc-space-8)',
            borderRadius: 'var(--pc-radius-pill)',
            background: 'transparent',
            color: 'var(--pc-fg)',
            border: '1px solid var(--pc-line-strong)',
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-sm)',
            fontWeight: 500,
            letterSpacing: 'var(--pc-track-wide)',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
          }}
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
