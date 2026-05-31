import Link from 'next/link';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';

const STEPS = [
  {
    num: '01',
    label: 'SOCIETY SIGNS UP',
    title: 'One contract, whole campus',
    body: 'The RWA or facility manager contacts us. We agree on a cleaning schedule, scope, and monthly fee. Typical setup takes under 48 hours from first call to first clean.',
  },
  {
    num: '02',
    label: 'RESIDENTS REGISTER',
    title: 'App install, unit + car added',
    body: "Residents download Perfect Cleaners and enter their unit number and vehicle details. No individual booking is ever required — they're covered automatically by the society contract.",
  },
  {
    num: '03',
    label: 'WE CLEAN',
    title: 'Certified workers arrive on schedule',
    body: 'Our trained team arrives at the society gate at the agreed time with professional-grade equipment. Every registered vehicle is serviced before the team departs.',
  },
  {
    num: '04',
    label: 'INSTANT NOTIFY',
    title: "Push notification the moment it's done",
    body: 'As soon as a worker marks a car clean in their app, the resident receives a push notification with a timestamp, vehicle registration, and before/after photos.',
  },
] as const;

const SOCIETY_BENEFITS = [
  {
    title: 'Fixed monthly pricing',
    body: 'One invoice for the entire society. No per-car complexity — a flat monthly fee agreed at contract time. Scales cleanly as new residents join.',
  },
  {
    title: 'Zero admin overhead',
    body: 'We handle scheduling, staffing, quality checks, and resident feedback collection. The RWA receives a monthly summary report.',
  },
  {
    title: 'Resident satisfaction lever',
    body: 'Clean cars every morning translate directly into resident happiness scores. Every partner society has reported improved RWA feedback after onboarding us.',
  },
  {
    title: 'Premium products, always',
    body: "We use Koch Chemie, Meguiar's, and CarPro across all society contracts — the same professional-grade products used in our individual premium bookings.",
  },
] as const;

const RESIDENT_BENEFITS = [
  {
    title: 'No booking, ever',
    body: 'Your car is cleaned on a fixed schedule whether you remember or not. Add your vehicle once in the app and you\'re covered for the duration of the contract.',
  },
  {
    title: 'Instant push notification',
    body: 'Know the exact moment your car was cleaned — complete with a before/after photo. No more uncertainty about whether today\'s session happened.',
  },
  {
    title: 'Cleaning history & photos',
    body: 'Every session is logged in the app with timestamps and photos. Your full cleaning history is always a tap away.',
  },
  {
    title: 'Premium products, not diluted alternatives',
    body: 'Your car receives the same professional-grade treatment as our individual premium bookings. No diluted consumer shortcuts.',
  },
] as const;

const PARTNER_SOCIETIES = [
  'Uniworld City', 'ATS Greens', 'Jaypee Wish Town', 'Supertech Supernova',
  'Gaur City', 'Amrapali Silicon City', 'Prateek Laurel', 'Antriksh Golf View',
] as const;

export default function ForSocietiesPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div style={{
          padding: 'var(--pc-space-16) var(--pc-screen-pad-lg) var(--pc-space-12)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-5)' }}>
            [FOR RESIDENTIAL SOCIETIES]
          </Eyebrow>
          <h1 style={{
            fontFamily: 'var(--pc-serif)',
            fontSize: 'clamp(36px, 6vw, 64px)',
            color: 'var(--pc-fg)',
            letterSpacing: 'var(--pc-track-tight)',
            lineHeight: 1.0,
            margin: '0 0 var(--pc-space-6)',
            maxWidth: 700,
          }}>
            Premium car care<br />for your entire community.
          </h1>
          <p style={{
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-lg)',
            color: 'var(--pc-fg-2)',
            lineHeight: 'var(--pc-lh-loose)',
            maxWidth: 520,
            margin: '0 0 var(--pc-space-8)',
          }}>
            One contract with the RWA covers every resident. We clean on a fixed schedule — and every car owner gets a push notification the moment their vehicle is done.
          </p>
          <div style={{ display: 'flex', gap: 'var(--pc-space-3)', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--pc-space-4) var(--pc-space-7)',
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                borderRadius: 'var(--pc-radius-pill)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)',
                textDecoration: 'none',
              }}
            >
              Get a Quote
            </Link>
            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--pc-space-4) var(--pc-space-7)',
                background: 'transparent', color: 'var(--pc-fg)',
                border: '1px solid var(--pc-line-strong)', borderRadius: 'var(--pc-radius-pill)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)',
                textDecoration: 'none',
              }}
            >
              How It Works
            </a>
          </div>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--pc-line)' }}>
          {[
            ['50+',     'Partner societies'],
            ['1,000+',  'Cars cleaned daily'],
            ['10,000+', 'Residents served'],
            ['< 5 min', 'Avg per vehicle'],
          ].map(([num, label], i, arr) => (
            <div key={label} style={{
              flex: 1, padding: 'var(--pc-space-6) var(--pc-screen-pad-lg)',
              borderRight: i < arr.length - 1 ? '1px solid var(--pc-line)' : 'none',
            }}>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(22px, 3vw, 36px)', color: 'var(--pc-fg)', margin: 0, lineHeight: 1 }}>{num}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', margin: 'var(--pc-space-1) 0 0' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <div id="how-it-works" style={{ padding: 'var(--pc-space-16) var(--pc-screen-pad-lg)', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-4)' }}>[HOW IT WORKS]</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 4vw, 44px)',
            color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)',
            lineHeight: 1.05, margin: '0 0 var(--pc-space-3)',
          }}>
            Contract to clean notification.
          </h2>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-3)', margin: '0 0 var(--pc-space-10)', maxWidth: 480 }}>
            A fully managed service with zero recurring effort for residents or the RWA.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--pc-space-3)' }}>
            {STEPS.map(step => (
              <div key={step.num} style={{
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-6)',
                display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-sage-hi)', letterSpacing: 'var(--pc-track-mono)' }}>
                    {step.label}
                  </span>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 32, color: 'var(--pc-line-strong)', lineHeight: 1 }}>{step.num}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 600, color: 'var(--pc-fg)', margin: 0, lineHeight: 1.3 }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-3)', lineHeight: 'var(--pc-lh-loose)', margin: 0, flex: 1 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Benefits: two columns ─────────────────────────────────────────── */}
        <div
          style={{
            padding: 'var(--pc-space-16) var(--pc-screen-pad-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--pc-space-10)',
            borderBottom: '1px solid var(--pc-line)',
          }}
        >
          <div>
            <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-4)' }}>[FOR THE RWA]</Eyebrow>
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', lineHeight: 1.1, margin: '0 0 var(--pc-space-8)' }}>Why societies choose us.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
              {SOCIETY_BENEFITS.map((b, i) => (
                <div key={b.title} style={{ display: 'flex', gap: 'var(--pc-space-4)' }}>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', flexShrink: 0, paddingTop: 2 }}>0{i + 1}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 var(--pc-space-2)' }}>{b.title}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-3)', lineHeight: 'var(--pc-lh-loose)', margin: 0 }}>{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-4)' }}>[FOR RESIDENTS]</Eyebrow>
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', lineHeight: 1.1, margin: '0 0 var(--pc-space-8)' }}>What residents get.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
              {RESIDENT_BENEFITS.map((b, i) => (
                <div key={b.title} style={{ display: 'flex', gap: 'var(--pc-space-4)' }}>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', flexShrink: 0, paddingTop: 2 }}>0{i + 1}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 var(--pc-space-2)' }}>{b.title}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-3)', lineHeight: 'var(--pc-lh-loose)', margin: 0 }}>{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Partner societies ─────────────────────────────────────────────── */}
        <div style={{ padding: 'var(--pc-space-14) var(--pc-screen-pad-lg)', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-3)' }}>[OUR PARTNERS]</Eyebrow>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-3)', margin: '0 0 var(--pc-space-8)' }}>
            Serving premium residential communities across Delhi NCR.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pc-space-3)' }}>
            {PARTNER_SOCIETIES.map(name => (
              <div key={name} style={{
                padding: 'var(--pc-space-3) var(--pc-space-5)',
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                borderRadius: 'var(--pc-radius-pill)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)',
              }}>
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <div style={{ padding: 'var(--pc-space-16) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--pc-space-6)', maxWidth: 600 }}>
          <Eyebrow>[READY TO PARTNER?]</Eyebrow>
          <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', lineHeight: 1.05, margin: 0 }}>
            Partner your society.
          </h2>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-loose)', margin: 0 }}>
            Send us your society name and contact details. We will come back within 24 hours with a quote tailored to your number of units and vehicles.
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-8)',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)',
              textDecoration: 'none',
            }}
          >
            Contact Us →
          </Link>
        </div>

      </main>

      <Footer />
    </>
  );
}
