'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Cycle = 'weekly' | 'monthly' | 'yearly';

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    eyebrow: 'ESSENTIAL CARE',
    tagline: 'Consistent cleanliness, every week.',
    prices: { weekly: 899, monthly: 2999, yearly: 29999 },
    yearlyPerMonth: 2500,   // 29999 / 12, rounded
    popular: false,
    features: [
      'Weekly Exterior Wash',
      'Tyre dressing & shine included',
      'Interior dashboard wipe-down',
      '10% off on-demand bookings',
      'Priority scheduling',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    eyebrow: 'PREMIUM DETAIL',
    tagline: 'Showroom standard, consistently.',
    prices: { weekly: 1499, monthly: 4999, yearly: 49999 },
    yearlyPerMonth: 4167,
    popular: true,
    features: [
      'Weekly Premium Wash',
      'Full interior vacuum & steam clean',
      'Leather & dashboard conditioning',
      'Spray wax paint protection',
      '20% off Ceramic & PPF',
      'VIP emergency clean slots',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    eyebrow: 'CONCIERGE',
    tagline: 'White-glove care for exceptional cars.',
    prices: { weekly: 2499, monthly: 7999, yearly: 79999 },
    yearlyPerMonth: 6667,
    popular: false,
    features: [
      'Weekly Full Detail',
      'Paint decontamination (bi-weekly)',
      'Quarterly ceramic nano-coat boost',
      'Free pickup & drop-off',
      '30% off all additional services',
      'Dedicated detailing specialist',
    ],
  },
] as const;

// ─── FAQ items ────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Can I change or cancel my plan at any time?',
    a: 'You can upgrade or downgrade at any time — changes take effect from the next billing cycle. Cancellations require 30 days\' notice; no lock-ins on monthly or weekly plans.',
  },
  {
    q: 'What if I need to reschedule a visit?',
    a: 'Any visit can be rescheduled up to 48 hours in advance at no cost. Same-day rescheduling is handled on a best-effort basis — call us directly.',
  },
  {
    q: 'Is there a setup or joining fee?',
    a: 'None. Your first visit is booked within 3 business days of signing up. Annual plans are billed in full upfront; monthly and weekly plans are charged at the start of each cycle.',
  },
  {
    q: 'Do you service all vehicle types?',
    a: 'Yes — hatchbacks, sedans, SUVs, MUVs, and exotics. Larger vehicles (full-size SUVs, vans) may attract a small surcharge on Starter and Pro plans.',
  },
] as const;

// ─── FAQ accordion item ───────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid var(--pc-line)',
      padding: '20px 0',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', padding: 0,
        }}
      >
        <span style={{
          fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)',
          fontWeight: 500, color: 'var(--pc-fg)', lineHeight: 'var(--pc-lh-snug)',
        }}>{q}</span>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          border: '1px solid var(--pc-line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pc-fg-3)',
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform var(--pc-dur-fast) var(--pc-ease)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
          color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-loose)',
          marginTop: 12, maxWidth: 680,
        }}>{a}</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlansSection() {
  const [cycle, setCycle] = useState<Cycle>('monthly');

  const cycleLabel: Record<Cycle, string> = {
    weekly:  'wk',
    monthly: 'mo',
    yearly:  'yr',
  };

  return (
    <div style={{ padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-20)', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Hero header ── */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{
          display: 'inline-block',
          fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: 'var(--pc-track-wide)',
          color: 'var(--pc-fg-3)', textTransform: 'uppercase',
          border: '1px solid var(--pc-line)', borderRadius: 999,
          padding: '5px 14px', marginBottom: 20,
        }}>
          [SUBSCRIPTION PLANS]
        </div>

        <h1 style={{
          fontFamily: 'var(--pc-serif)', fontSize: 'clamp(40px, 5vw, 64px)',
          color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)',
          lineHeight: 'var(--pc-lh-tight)', margin: '0 0 16px',
        }}>
          Choose your cadence.
        </h1>

        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)',
          color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-body)',
          maxWidth: 520, margin: '0 auto 40px',
        }}>
          Regular care, predictable pricing. Pick the frequency that fits your life — cancel or change anytime.
        </p>

        {/* Billing cycle toggle — full-width on mobile so 3 buttons have room */}
        <div style={{
          display: 'inline-flex', gap: 4, padding: 4,
          background: 'var(--pc-card)', borderRadius: 999,
          border: '1px solid var(--pc-line)',
          maxWidth: '100%',
        }}>
          {(['weekly', 'monthly', 'yearly'] as Cycle[]).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              style={{
                padding: 'clamp(8px, 2vw, 9px) clamp(12px, 3vw, 20px)',
                borderRadius: 999,
                background: cycle === c ? 'var(--pc-ink-raised)' : 'transparent',
                color: cycle === c ? 'var(--pc-fg)' : 'var(--pc-fg-2)',
                border: cycle === c ? '1px solid var(--pc-line-strong)' : '1px solid transparent',
                fontFamily: 'var(--pc-sans)',
                fontSize: 'clamp(12px, 3vw, var(--pc-text-sm))',
                fontWeight: cycle === c ? 600 : 400,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                gap: 'clamp(4px, 1vw, 7px)',
                whiteSpace: 'nowrap',
                transition: 'background var(--pc-dur-fast) var(--pc-ease), color var(--pc-dur-fast) var(--pc-ease)',
              }}
            >
              {c === 'weekly' ? 'Weekly' : c === 'monthly' ? 'Monthly' : 'Yearly'}
              {c === 'monthly' && (
                <span style={{
                  background: 'rgba(91,111,82,0.25)',
                  color: 'var(--pc-sage-ink)',
                  borderRadius: 999,
                  padding: '2px 6px',
                  fontFamily: 'var(--pc-mono)', fontSize: 9,
                  letterSpacing: 'var(--pc-track-mono)',
                  display: 'inline-block',
                }}>−23%</span>
              )}
              {c === 'yearly' && (
                <span style={{
                  background: 'rgba(91,111,82,0.25)',
                  color: 'var(--pc-sage-ink)',
                  borderRadius: 999,
                  padding: '2px 6px',
                  fontFamily: 'var(--pc-mono)', fontSize: 9,
                  letterSpacing: 'var(--pc-track-mono)',
                  display: 'inline-block',
                }}>−17%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        alignItems: 'start',
        marginBottom: 80,
      }}>
        {PLANS.map(plan => {
          const price   = plan.prices[cycle];
          const popular = plan.popular;

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--pc-card)',
                border: `1px solid ${popular ? 'rgba(91,111,82,0.55)' : 'var(--pc-line)'}`,
                borderRadius: 20,
                padding: 'clamp(24px, 5vw, 36px) clamp(20px, 5vw, 32px)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                boxShadow: popular ? 'var(--pc-shadow-glow-sage)' : 'none',
              }}
            >
              {popular && (
                <div style={{
                  position: 'absolute', top: -13, left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--pc-sage)',
                  color: 'var(--pc-sage-ink)',
                  padding: '4px 16px',
                  borderRadius: 999,
                  fontFamily: 'var(--pc-mono)', fontSize: 9,
                  letterSpacing: 'var(--pc-track-wide)',
                  whiteSpace: 'nowrap',
                }}>MOST POPULAR</div>
              )}

              {/* Eyebrow */}
              <div style={{
                fontFamily: 'var(--pc-mono)', fontSize: 9,
                letterSpacing: 'var(--pc-track-wide)',
                color: popular ? 'var(--pc-sage-hi)' : 'var(--pc-fg-3)',
                marginBottom: 10,
              }}>{plan.eyebrow}</div>

              {/* Plan name */}
              <h2 style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 'clamp(28px, 3vw, 36px)',
                color: 'var(--pc-fg)',
                letterSpacing: 'var(--pc-track-tight)',
                margin: '0 0 6px', lineHeight: 1,
              }}>{plan.name}</h2>

              {/* Tagline */}
              <p style={{
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-body)',
                margin: '0 0 28px',
              }}>{plan.tagline}</p>

              {/* Price */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{
                    fontFamily: 'var(--pc-serif)',
                    fontSize: 'clamp(40px, 4vw, 52px)',
                    color: 'var(--pc-fg)',
                    letterSpacing: 'var(--pc-track-tight)',
                    lineHeight: 1,
                  }}>
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                    color: 'var(--pc-fg-3)',
                  }}>/{cycleLabel[cycle]}</span>
                </div>

                <div style={{
                  fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)',
                  color: 'var(--pc-fg-3)', marginTop: 6, lineHeight: 'var(--pc-lh-body)',
                }}>
                  {cycle === 'yearly' && `≈ ₹${plan.yearlyPerMonth.toLocaleString('en-IN')}/mo · billed annually`}
                  {cycle === 'monthly' && '~4 visits per month · billed monthly'}
                  {cycle === 'weekly' && '1 visit per week · billed weekly'}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--pc-line)', marginBottom: 24 }} />

              {/* Features */}
              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 32px',
                display: 'flex', flexDirection: 'column', gap: 12, flex: 1,
              }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={popular ? 'var(--pc-sage-hi)' : 'var(--pc-fg-3)'}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    >
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    <span style={{
                      fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                      color: 'var(--pc-fg)', lineHeight: 'var(--pc-lh-body)',
                    }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={`/book?plan=${plan.id}&cycle=${cycle}`}
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 0', borderRadius: 999,
                  background: popular ? 'var(--pc-warm)' : 'transparent',
                  color: popular ? 'var(--pc-ink)' : 'var(--pc-fg)',
                  border: popular ? 'none' : '1px solid var(--pc-line-strong)',
                  fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                  fontWeight: popular ? 600 : 500,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'opacity var(--pc-dur-fast) var(--pc-ease)',
                }}
              >
                Get Started →
              </Link>
            </div>
          );
        })}
      </div>

      {/* ── Value comparison strip ── */}
      <div style={{
        background: 'var(--pc-card)',
        border: '1px solid var(--pc-line)',
        borderRadius: 16,
        padding: '28px 36px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 24,
        marginBottom: 80,
        textAlign: 'center',
      }}>
        {[
          { num: '₹0',     label: 'Setup fee'              },
          { num: '48 hr',  label: 'Free reschedule window' },
          { num: '30-day', label: 'Cancellation notice'    },
          { num: '3 days', label: 'First visit turnaround' },
        ].map(({ num, label }) => (
          <div key={label}>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 3vw, 36px)',
              color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)',
              marginBottom: 6,
            }}>{num}</div>
            <div style={{
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase',
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: 'var(--pc-track-wide)',
          color: 'var(--pc-fg-3)', textTransform: 'uppercase',
          marginBottom: 32, textAlign: 'center',
        }}>
          [COMMON QUESTIONS]
        </div>
        {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
      </div>

      {/* ── Compare tiers link ── */}
      <div style={{ textAlign: 'center', marginTop: 56 }}>
        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
          color: 'var(--pc-fg-3)', marginBottom: 12,
        }}>
          Looking for a one-time booking instead?
        </p>
        <Link href="/book" style={{
          fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
          color: 'var(--pc-fg-2)', textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}>
          Book a single service →
        </Link>
      </div>
    </div>
  );
}
