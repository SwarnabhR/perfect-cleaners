import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'For Societies | Perfect Cleaners',
  description: 'Bring scheduled, crew-based car washing to your housing society. Free to list — residents pay per wash, the RWA is never invoiced.',
};

const steps = [
  { n: '01', title: 'Register your society', body: 'Fill in a short form with your society name, location, and approximate number of cars. Takes under two minutes.' },
  { n: '02', title: 'We confirm coverage', body: 'Our team checks whether your pin-code is in our service zone and reaches out within 24 hours.' },
  { n: '03', title: 'Agree on a schedule', body: 'Pick visit days — Daily, Alternate-day, or Weekly. Residents register their own cars in the app and pay per wash. The society is never invoiced.' },
  { n: '04', title: 'We show up', body: 'A dedicated crew arrives at the agreed time every session. Residents track status in the app.' },
];

const benefits: { icon: string; title: string; body: string }[] = [
  {
    icon: 'indian-rupee',
    title: 'Per-wash pricing',
    body: 'Residents pay only for what they use. Rates are agreed per society and shown in the app before residents register — no surprises.',
  },
  {
    icon: 'calendar',
    title: 'Fixed schedule',
    body: 'One recurring slot for the whole complex — no individual booking coordination required.',
  },
  {
    icon: 'smartphone',
    title: 'Resident app access',
    body: 'Every resident gets live status updates, wash history, and a push notification the moment their car is clean.',
  },
  {
    icon: 'file-text',
    title: 'Monthly activity report',
    body: 'Society management gets a monthly summary of visits, cars cleaned, and resident coverage. Zero admin overhead.',
  },
  {
    icon: 'shield',
    title: 'Verified crew',
    body: 'Every worker is background-checked and carries a QR-verified ID badge displayed in the app.',
  },
  {
    icon: 'message-circle',
    title: 'Dedicated support',
    body: 'A named account manager for every society. Reach them on WhatsApp or email — no ticket queues.',
  },
];

const stats = [
  { n: '120+', l: 'Societies served' },
  { n: '8,000+', l: 'Vehicles washed / month' },
  { n: '4.8 ★', l: 'Average society rating' },
  { n: '< 24 h', l: 'Onboarding time' },
];

export default function ForSocietiesPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72 }}>

        {/* ── Hero ── */}
        <section style={{
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-16)',
          maxWidth: 'var(--pc-maxw-content)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--pc-space-12)',
          alignItems: 'center',
        }} className="pc-about-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
            <Eyebrow>For Residential Societies</Eyebrow>
            <h1 style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 'var(--pc-text-3xl)',
              lineHeight: 'var(--pc-lh-tight)',
              letterSpacing: 'var(--pc-track-tight)',
              color: 'var(--pc-fg)',
              margin: 0,
            }}>
              One booking.<br />Every car.<br />Every morning.
            </h1>
            <p style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-base)',
              color: 'var(--pc-fg-2)',
              lineHeight: 'var(--pc-lh-loose)',
              maxWidth: 420,
              margin: 0,
            }}>
              Perfect Cleaners partners with housing societies to provide
              scheduled, crew-based car washing for every resident — at
              discounted bulk rates with zero coordination overhead.
            </p>
            {/* ── CTA pair — identical to Hero / CTASection pill design ── */}
            <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
              <Link
                href="/contact"
                className="pc-hero-cta-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: 'var(--pc-space-4) var(--pc-space-6)',
                  background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                  border: 'none', borderRadius: 'var(--pc-radius-pill)',
                  fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                  fontWeight: 600, letterSpacing: 'var(--pc-track-wide)',
                  textTransform: 'uppercase', textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
                }}
              >
                Register your society
              </Link>
              <Link
                href="/contact"
                className="pc-hero-cta-ghost"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: 'var(--pc-space-4) var(--pc-space-6)',
                  background: 'transparent', color: 'var(--pc-fg)',
                  border: '1px solid var(--pc-line-warm)', borderRadius: 'var(--pc-radius-pill)',
                  fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                  fontWeight: 500, letterSpacing: 'var(--pc-track-wide)',
                  textTransform: 'uppercase', textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
                }}
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right photo */}
          <div style={{
            position: 'relative', height: 380,
            borderRadius: 'var(--pc-radius-xl)', overflow: 'hidden',
            border: '1px solid var(--pc-line)',
          }}>
            <Image
              src="/hero-professional-detailer.png"
              alt="Perfect Cleaners crew washing cars in a residential society"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section style={{
          borderTop: '1px solid var(--pc-line)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          <div
            className="pc-for-societies-stats"
            style={{
              maxWidth: 'var(--pc-maxw-content)',
              margin: '0 auto',
              padding: 'var(--pc-space-8) var(--pc-screen-pad-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.l}
                style={{
                  padding: 'var(--pc-space-4) var(--pc-space-5)',
                  borderRight: i < stats.length - 1 ? '1px solid var(--pc-line)' : 'none',
                }}
              >
                <p style={{
                  fontFamily: 'var(--pc-serif)',
                  fontSize: 'var(--pc-text-2xl)',
                  color: 'var(--pc-fg)',
                  letterSpacing: 'var(--pc-track-tight)',
                  lineHeight: 1,
                  margin: '0 0 var(--pc-space-1)',
                }}>{s.n}</p>
                <p style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-xs)',
                  color: 'var(--pc-fg-3)',
                  margin: 0,
                  letterSpacing: 'var(--pc-track-wide)',
                  textTransform: 'uppercase',
                }}>{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{
          maxWidth: 'var(--pc-maxw-content)',
          margin: '0 auto',
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
        }}>
          <Eyebrow style={{ marginBottom: 'var(--pc-space-6)' }}>How it works</Eyebrow>
          <div
            className="pc-for-societies-steps"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 'var(--pc-space-6)',
            }}
          >
            {steps.map(s => (
              <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
                <span style={{
                  fontFamily: 'var(--pc-mono)',
                  fontSize: 'var(--pc-text-xs)',
                  color: 'var(--pc-sage-hi)',
                  letterSpacing: 'var(--pc-track-mono)',
                }}>{s.n}</span>
                <h3 style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-base)',
                  fontWeight: 600,
                  color: 'var(--pc-fg)',
                  margin: 0,
                  lineHeight: 'var(--pc-lh-snug)',
                }}>{s.title}</h3>
                <p style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-sm)',
                  color: 'var(--pc-fg-2)',
                  lineHeight: 'var(--pc-lh-body)',
                  margin: 0,
                }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Benefits grid ── */}
        <section style={{
          background: 'var(--pc-card)',
          borderTop: '1px solid var(--pc-line)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          <div
            className="pc-for-societies-benefits"
            style={{
              maxWidth: 'var(--pc-maxw-content)',
              margin: '0 auto',
              padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 'var(--pc-space-8) var(--pc-space-10)',
            }}
          >
            {benefits.map(b => (
              <div key={b.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={b.icon} size={16} color="var(--pc-sage-ink)" />
                </div>
                <h3 style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-base)',
                  fontWeight: 600,
                  color: 'var(--pc-fg)',
                  margin: 0,
                }}>{b.title}</h3>
                <p style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-sm)',
                  color: 'var(--pc-fg-2)',
                  lineHeight: 'var(--pc-lh-body)',
                  margin: 0,
                }}>{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{
          maxWidth: 'var(--pc-maxw-content)',
          margin: '0 auto',
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--pc-space-5)',
        }}>
          <Eyebrow>Get started today</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--pc-serif)',
            fontSize: 'var(--pc-text-2xl)',
            lineHeight: 'var(--pc-lh-tight)',
            letterSpacing: 'var(--pc-track-tight)',
            color: 'var(--pc-fg)',
            margin: 0,
            maxWidth: 480,
          }}>
            Ready to bring perfect cleaning to your society?
          </h2>
          <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/contact"
              className="pc-hero-cta-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--pc-space-4) var(--pc-space-6)',
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                border: 'none', borderRadius: 'var(--pc-radius-pill)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                fontWeight: 600, letterSpacing: 'var(--pc-track-wide)',
                textTransform: 'uppercase', textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
              }}
            >
              Register your society
            </Link>
            <Link
              href="/contact"
              className="pc-hero-cta-ghost"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--pc-space-4) var(--pc-space-6)',
                background: 'transparent', color: 'var(--pc-fg)',
                border: '1px solid var(--pc-line-warm)', borderRadius: 'var(--pc-radius-pill)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                fontWeight: 500, letterSpacing: 'var(--pc-track-wide)',
                textTransform: 'uppercase', textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
              }}
            >
              Contact Us
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
