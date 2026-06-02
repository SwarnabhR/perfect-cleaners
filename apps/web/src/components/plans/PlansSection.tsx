'use client';

import { useState } from 'react';
import Link from 'next/link';

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Register your car',
    body: 'Download the app, select your society and tower, and add your vehicle. That is all the setup you ever need to do.',
  },
  {
    num: '02',
    title: 'We clean on schedule',
    body: 'Workers arrive at your society on agreed days and clean every registered car. No booking. No reminders. No action needed from you.',
  },
  {
    num: '03',
    title: 'You get notified instantly',
    body: 'The moment your car is marked clean, you receive a push notification with the time and before/after photos.',
  },
  {
    num: '04',
    title: 'Bill accumulates, you pay when ready',
    body: 'Each wash adds the society\'s fixed price to your outstanding balance. Pay whenever you like from the app — no due dates, no late fees.',
  },
] as const;

const FAQS = [
  {
    q: 'How is the price per wash decided?',
    a: 'The price is set per society and agreed when the society is listed on the platform. It is a fixed amount per clean — the same for every vehicle in the society regardless of size. Your society manager or admin can confirm the exact figure.',
  },
  {
    q: 'When do I need to pay?',
    a: 'There is no due date or billing cycle. Your outstanding balance accumulates as washes happen. You can pay off the full amount (or part of it) at any time from the Bill screen in the app. We will continue cleaning your car while there is an outstanding balance.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'UPI, credit/debit card, and net banking via Razorpay. All payments are encrypted and processed securely.',
  },
  {
    q: 'Can I pause or stop the service?',
    a: 'Contact us or your society admin to remove your vehicle from the active list. Any outstanding balance at that point remains payable.',
  },
  {
    q: 'What happens if my society is not listed yet?',
    a: 'Ask your RWA or facility manager to list the society — it is free and takes under 24 hours. Once listed, you can register immediately.',
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--pc-line)', padding: '20px 0' }}>
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0,
        }}
      >
        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 500, color: 'var(--pc-fg)', lineHeight: 'var(--pc-lh-snug)' }}>
          {q}
        </span>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          border: '1px solid var(--pc-line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pc-fg-3)',
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform var(--pc-dur-fast) var(--pc-ease)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-loose)', marginTop: 12, maxWidth: 680 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function PlansSection() {
  return (
    <div style={{ padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-20)', maxWidth: 1200, margin: '0 auto' }}>

      {/* Hero header */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{
          display: 'inline-block',
          fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: 'var(--pc-track-wide)',
          color: 'var(--pc-fg-3)', textTransform: 'uppercase',
          border: '1px solid var(--pc-line)', borderRadius: 999,
          padding: '5px 14px', marginBottom: 20,
        }}>
          [HOW BILLING WORKS]
        </div>

        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', lineHeight: 'var(--pc-lh-tight)', margin: '0 0 20px' }}>
          Pay per wash.<br />No subscriptions.
        </h1>

        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-loose)', maxWidth: 520, margin: '0 auto 40px' }}>
          Each wash adds a fixed amount to your outstanding balance. Pay it off whenever you like — no due dates, no lock-in, no billing cycles.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/for-societies"
            className="pc-hero-cta-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              border: 'none',
              borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)', textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            Is my society listed?
          </Link>
          <Link
            href="/contact"
            className="pc-hero-cta-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              border: 'none',
              borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)', textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* How it works — 4 steps */}
      <div className="pc-plans-grid" style={{ marginBottom: 64 }}>
        {HOW_IT_WORKS.map(step => (
          <div key={step.num} style={{
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)',
            padding: 'clamp(20px, 4vw, 32px)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-sage-hi)', letterSpacing: 'var(--pc-track-mono)' }}>
                STEP {step.num}
              </span>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 28, color: 'var(--pc-line-strong)', lineHeight: 1 }}>
                {step.num}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 600, color: 'var(--pc-fg)', margin: 0, lineHeight: 1.3 }}>
              {step.title}
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-3)', lineHeight: 'var(--pc-lh-loose)', margin: 0, flex: 1 }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Value strip */}
      <div className="pc-plans-value-strip" style={{ marginBottom: 64 }}>
        {[
          { num: '₹0',     label: 'Setup fee'          },
          { num: '₹0',     label: 'Cancellation fee'   },
          { num: 'Any',    label: 'Pay anytime'         },
          { num: '< 5 min', label: 'Avg per vehicle'   },
        ].map(({ num, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', marginBottom: 6 }}>
              {num}
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-wide)', textTransform: 'uppercase' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: 'var(--pc-track-wide)', color: 'var(--pc-fg-3)', textTransform: 'uppercase', marginBottom: 32, textAlign: 'center' }}>
          [COMMON QUESTIONS]
        </div>
        {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
      </div>

    </div>
  );
}
