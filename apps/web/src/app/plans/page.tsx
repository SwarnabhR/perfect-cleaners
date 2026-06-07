'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Cycle = 'weekly' | 'monthly' | 'yearly';

const CYCLES: { key: Cycle; label: string }[] = [
  { key: 'weekly',  label: 'Weekly'  },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly',  label: 'Yearly'  },
];

interface Plan {
  id:     'starter' | 'pro' | 'elite';
  name:   string;
  tag:    string;
  prices: Record<Cycle, number>;
  desc:   string;
  perks:  string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id:    'starter',
    name:  'Starter',
    tag:   'Exterior Wash',
    prices: { weekly: 699, monthly: 2499, yearly: 24999 },
    desc:  'Foam cannon pre-rinse, hand-mitt wash, ceramic rinse aid, and tyre dressing — every visit.',
    perks: [
      'Foam cannon pre-rinse',
      'Hand-mitt exterior wash',
      'Ceramic rinse aid',
      'Tyre dressing',
      'Microfiber dry',
    ],
  },
  {
    id:    'pro',
    name:  'Pro',
    tag:   'Premium Wash',
    prices: { weekly: 1499, monthly: 4999, yearly: 49999 },
    desc:  'Everything in Starter plus a full interior wipe, dashboard clean, and glass polish — inside and out.',
    popular: true,
    perks: [
      'Everything in Starter',
      'Full interior wipe-down',
      'Dashboard & console clean',
      'Glass polish (int + ext)',
      'Door jamb clean',
      'Priority scheduling',
    ],
  },
  {
    id:    'elite',
    name:  'Elite',
    tag:   'Full Detail',
    prices: { weekly: 2499, monthly: 7999, yearly: 79999 },
    desc:  'Complete interior + exterior detailing with engine bay clean and a dedicated senior technician.',
    perks: [
      'Everything in Pro',
      'Steam-clean upholstery',
      'Leather conditioning',
      'Engine bay clean',
      'Paint decontamination wash',
      'Dedicated senior technician',
      '24 hr WhatsApp support',
    ],
  },
];

const YEARLY_SAVINGS: Record<Exclude<Plan['id'], never>, number> = {
  starter: Math.round((699 * 52 - 24999) / (699 * 52) * 100),
  pro:     Math.round((1499 * 52 - 49999) / (1499 * 52) * 100),
  elite:   Math.round((2499 * 52 - 79999) / (2499 * 52) * 100),
};

function fmtPrice(n: number, cycle: Cycle) {
  return `₹${n.toLocaleString('en-IN')}${cycle === 'weekly' ? '/wk' : cycle === 'monthly' ? '/mo' : '/yr'}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const router  = useRouter();
  const [cycle, setCycle] = useState<Cycle>('monthly');

  function book(plan: Plan) {
    router.push(`/book?plan=${plan.id}&cycle=${cycle}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{ flex: 1, padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Hero copy */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--pc-space-16)' }}>
            <Eyebrow>[SUBSCRIPTION PLANS]</Eyebrow>
            <h1 style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 400,
              color: 'var(--pc-fg)',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: 'var(--pc-space-4) 0 var(--pc-space-5)',
            }}>
              A Clean Car,<br />Every Week.
            </h1>
            <p style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-lg)',
              color: 'var(--pc-fg-2)',
              lineHeight: 1.6,
              maxWidth: 520,
              margin: '0 auto var(--pc-space-10)',
            }}>
              Skip the one-off bookings. Choose a plan, set a cadence, and we show up — same technician, every time.
            </p>

            {/* Cycle toggle */}
            <div style={{
              display: 'inline-flex',
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)',
              borderRadius: 999,
              padding: 4,
              gap: 2,
            }}>
              {CYCLES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCycle(c.key)}
                  style={{
                    padding: '8px 22px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    background: cycle === c.key ? 'var(--pc-warm)'   : 'transparent',
                    color:      cycle === c.key ? 'var(--pc-ink)'    : 'var(--pc-fg-3)',
                    transition: 'background 0.15s, color 0.15s',
                    position: 'relative',
                  }}
                >
                  {c.label}
                  {c.key === 'yearly' && (
                    <span style={{
                      position: 'absolute',
                      top: -8, right: -2,
                      background: 'var(--pc-sage)',
                      color: 'var(--pc-sage-ink)',
                      fontFamily: 'var(--pc-mono)',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      padding: '2px 6px',
                      borderRadius: 999,
                    }}>
                      SAVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="pc-plans-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--pc-space-6)',
            alignItems: 'stretch',
          }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  background: plan.popular ? 'var(--pc-card-hi)' : 'var(--pc-card)',
                  border: `1px solid ${plan.popular ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                  borderRadius: 'var(--pc-radius-lg)',
                  padding: 'var(--pc-space-8)',
                  gap: 'var(--pc-space-6)',
                }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: -12, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--pc-sage)',
                    color: 'var(--pc-sage-ink)',
                    fontFamily: 'var(--pc-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    padding: '4px 14px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                {/* Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--pc-space-3)' }}>
                    <Eyebrow style={{ margin: 0 }}>[{plan.tag.toUpperCase()}]</Eyebrow>
                    {cycle === 'yearly' && (
                      <span style={{
                        fontFamily: 'var(--pc-mono)',
                        fontSize: 9,
                        color: 'var(--pc-sage-hi)',
                        letterSpacing: '0.06em',
                        background: 'rgba(74,94,68,0.15)',
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}>
                        SAVE {YEARLY_SAVINGS[plan.id]}%
                      </span>
                    )}
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--pc-serif)',
                    fontSize: 28,
                    fontWeight: 400,
                    color: 'var(--pc-fg)',
                    letterSpacing: '-0.02em',
                    margin: '0 0 var(--pc-space-2)',
                  }}>
                    {plan.name}
                  </h2>
                  <div style={{
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 32,
                    fontWeight: 700,
                    color: 'var(--pc-fg)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: 'var(--pc-space-3)',
                  }}>
                    {fmtPrice(plan.prices[cycle], cycle)}
                  </div>
                  <p style={{
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 13,
                    color: 'var(--pc-fg-3)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {plan.desc}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--pc-line)' }} />

                {/* Perks */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)', flex: 1 }}>
                  {plan.perks.map(perk => (
                    <li key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--pc-space-3)' }}>
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        <Icon name="check" size={14} color="var(--pc-sage-hi)" />
                      </div>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => book(plan)}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: 999,
                    border: plan.popular ? 'none' : '1px solid var(--pc-line-strong)',
                    background: plan.popular ? 'var(--pc-warm)' : 'transparent',
                    color: plan.popular ? 'var(--pc-ink)' : 'var(--pc-fg)',
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 0.15s, opacity 0.15s',
                  }}
                >
                  Book {plan.name} →
                </button>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            textAlign: 'center',
            marginTop: 'var(--pc-space-16)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--pc-space-3)',
            alignItems: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 13,
              color: 'var(--pc-fg-3)',
              lineHeight: 1.6,
              maxWidth: 480,
              margin: 0,
            }}>
              All plans include GST. No hidden charges. Cancel or pause anytime — we only ask for 48 hours notice.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-6)' }}>
              {[
                { icon: 'shield-check', text: 'Insured technicians' },
                { icon: 'rotate-ccw',  text: 'Pause anytime'       },
                { icon: 'star',        text: 'Rated 4.9 / 5'       },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={icon} size={14} color="var(--pc-fg-3)" />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
