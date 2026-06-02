'use client';

import Link from 'next/link';
import Icon from '@/components/ui/Icon';

// ─── How residents join — 4 steps ─────────────────────────────────────────────

const STEPS = [
  {
    num:   '01',
    icon:  'smartphone',
    title: 'Download the app',
    body:  'Available on Android and iOS. Takes under a minute to install and sign up with your phone number.',
  },
  {
    num:   '02',
    icon:  'building-2',
    title: 'Select your society',
    body:  'Search for your residential society. If it is not listed yet, ask your RWA to register — it is free and takes 24 hours.',
  },
  {
    num:   '03',
    icon:  'car',
    title: 'Add your vehicle',
    body:  'Enter your registration number and tower / unit. Your car is now on the list for every cleaning run.',
  },
  {
    num:   '04',
    icon:  'bell',
    title: 'Get notified every time',
    body:  'Workers clean your car on the society schedule. The moment it is done, you get a push notification with the time and plate number.',
  },
] as const;

// ─── Billing explainer ────────────────────────────────────────────────────────

const BILLING_POINTS = [
  { icon: 'indian-rupee', title: 'Pay per wash',      body: 'Each clean adds a fixed amount to your outstanding balance. No monthly fees, no lock-in.' },
  { icon: 'clock',        title: 'Pay whenever',       body: 'There is no due date. Pay off your balance in full or in part whenever you like from the app.' },
  { icon: 'check-circle', title: 'Always included',   body: 'Your car keeps getting cleaned even while you have an outstanding balance. We never skip your car.' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembershipCards() {
  return (
    <div style={{ padding: 'var(--pc-space-6) var(--pc-screen-pad-lg) var(--pc-space-20)', maxWidth: 1100, margin: '0 auto' }}>

      {/* How-to steps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 64,
      }}>
        {STEPS.map(step => (
          <div
            key={step.num}
            style={{
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)',
              borderRadius: 'var(--pc-radius-md)',
              padding: 'clamp(20px, 4vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--pc-sage)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={step.icon} size={18} color="var(--pc-sage-ink)" />
              </div>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 28, color: 'var(--pc-line-strong)', lineHeight: 1 }}>
                {step.num}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 600, color: 'var(--pc-fg)', margin: 0, lineHeight: 1.3 }}>
              {step.title}
            </h3>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-3)', lineHeight: 'var(--pc-lh-loose)', margin: 0, flex: 1 }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Billing explainer */}
      <div style={{
        background: 'var(--pc-card)',
        border: '1px solid var(--pc-line)',
        borderRadius: 'var(--pc-radius-lg)',
        padding: 'clamp(24px, 4vw, 40px)',
        marginBottom: 48,
      }}>
        <p style={{
          fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 24px',
        }}>
          [HOW BILLING WORKS]
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {BILLING_POINTS.map(pt => (
            <div key={pt.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'color-mix(in srgb, var(--pc-sage) 12%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>
                <Icon name={pt.icon} size={16} color="var(--pc-sage-hi)" />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 4px' }}>
                  {pt.title}
                </p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', lineHeight: 1.6, margin: 0 }}>
                  {pt.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/app"
          className="pc-hero-cta-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--pc-space-4) var(--pc-space-8)',
            background: 'var(--pc-warm)', color: 'var(--pc-ink)',
            border: 'none', borderRadius: 'var(--pc-radius-pill)',
            fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)',
            textDecoration: 'none',
            transition: 'background var(--pc-dur-fast) var(--pc-ease)',
          }}
        >
          Download the app →
        </Link>
        <Link
          href="/for-societies"
          className="pc-hero-cta-ghost"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--pc-space-4) var(--pc-space-8)',
            background: 'transparent', color: 'var(--pc-fg)',
            border: '1px solid currentColor', borderRadius: 'var(--pc-radius-pill)',
            fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)',
            textDecoration: 'none',
            transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
          }}
        >
          For societies →
        </Link>
      </div>

    </div>
  );
}
