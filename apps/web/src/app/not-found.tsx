import Link from 'next/link';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--pc-space-20) var(--pc-space-6)',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--pc-fg-3)', marginBottom: 16,
        }}>
          404
        </p>
        <h1 style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 400,
          color: 'var(--pc-fg)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          Page not found.
        </h1>
        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 15,
          color: 'var(--pc-fg-2)', lineHeight: 1.6,
          maxWidth: 360, marginBottom: 40,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 28px', borderRadius: 999,
            background: 'var(--pc-warm)', color: 'var(--pc-ink)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Back to Home
          </Link>
          <Link href="/for-societies" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 28px', borderRadius: 999,
            background: 'transparent', color: 'var(--pc-fg)',
            border: '1px solid currentColor',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none',
          }}>
            For Societies
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
