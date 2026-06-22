import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import AppWaitlistForm from './AppWaitlistForm';

export const metadata: Metadata = {
  title: 'App — Coming Soon',
  description: 'The Perfect Cleaners mobile app is on its way. Book, track, and manage your car care from your pocket.',
};

// ─── App store badge ──────────────────────────────────────────────────────────

function StoreBadge({
  icon, store, sub, disabled = true,
}: {
  icon:      React.ReactNode;
  store:     string;
  sub:       string;
  disabled?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 22px',
      background: disabled ? 'var(--pc-card)' : 'var(--pc-fg)',
      border: '1px solid var(--pc-line-strong)',
      borderRadius: 'var(--pc-radius-md)',
      opacity: disabled ? 0.55 : 1,
      cursor: disabled ? 'default' : 'pointer',
      minWidth: 180,
      userSelect: 'none',
      position: 'relative',
    }}>
      <div style={{ color: disabled ? 'var(--pc-fg-3)' : 'var(--pc-ink)', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{
          fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: disabled ? 'var(--pc-fg-4)' : 'var(--pc-ink)',
          margin: 0,
        }}>
          {sub}
        </p>
        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 15, fontWeight: 600,
          color: disabled ? 'var(--pc-fg-3)' : 'var(--pc-ink)',
          margin: '2px 0 0', letterSpacing: '-0.01em',
        }}>
          {store}
        </p>
      </div>
      {disabled && (
        <span style={{
          position: 'absolute', top: -10, right: 12,
          fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: 'var(--pc-sage)', color: 'var(--pc-sage-ink)',
          padding: '3px 8px', borderRadius: 'var(--pc-radius-pill)',
        }}>
          Soon
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{ flex: 1 }}>

        {/* Hero */}
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-16)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'center',
        }}
          className="pc-app-hero"
        >
          {/* Left — copy */}
          <div>
            <p style={{
              fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 20,
            }}>
              [MOBILE APP] / ANDROID &amp; IOS
            </p>

            <h1 style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 400,
              color: 'var(--pc-fg)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              marginBottom: 24,
            }}>
              Your car, cared for.<br />In your pocket.
            </h1>

            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)',
              color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-loose)',
              maxWidth: 460, marginBottom: 40,
            }}>
              Book a wash or detail in under two minutes, track your technician live, and see before/after photos the moment your car is done. Available soon on Android and iOS.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 48 }}>
              {['Live job tracker', 'Instant wash notifications', 'Saved vehicles', 'Booking history', 'Wallet & rewards'].map(f => (
                <span key={f} style={{
                  fontFamily: 'var(--pc-mono)', fontSize: 10.5, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  border: '1px solid var(--pc-line-strong)',
                  borderRadius: 'var(--pc-radius-pill)',
                  color: 'var(--pc-fg-3)',
                }}>
                  {f}
                </span>
              ))}
            </div>

            {/* Store badges */}
            <div className="pc-app-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 48 }}>
              <StoreBadge
                store="App Store"
                sub="Download on the"
                icon={
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                }
              />
              <StoreBadge
                store="Google Play"
                sub="Get it on"
                icon={
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 20.5v-17c0-.83 1-.99 1.49-.5l14 8.5c.49.3.49 1.2 0 1.5l-14 8.5c-.49.5-1.49.33-1.49-.5z"/>
                  </svg>
                }
              />
            </div>

            {/* APK direct download note */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 18px',
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)',
              borderRadius: 'var(--pc-radius-md)',
              maxWidth: 460,
              marginBottom: 48,
            }}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}
                   stroke="var(--pc-sage-hi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v13M8 11l4 4 4-4M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"/>
              </svg>
              <div>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0, lineHeight: 1.6 }}>
                  Android APK early access will be available for direct download here before the Play Store listing goes live.
                </p>
              </div>
            </div>

            {/* Waitlist form */}
            <AppWaitlistForm />
          </div>

          {/* Right — app screenshot */}
          <div style={{
            flexShrink: 0,
            width: 'clamp(180px, 22vw, 280px)',
          }}
            className="pc-app-screenshot"
          >
            <div style={{
              borderRadius: 36,
              overflow: 'hidden',
              border: '1px solid var(--pc-line-strong)',
              boxShadow: 'var(--pc-shadow-raised)',
            }}>
              <Image
                src="/hero-booking-app.png"
                alt="Perfect Cleaners mobile app"
                width={280}
                height={560}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
