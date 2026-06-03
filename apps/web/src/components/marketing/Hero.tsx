'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/i18n';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';

export default function Hero() {
  const { t } = useI18n();
  const h = t.hero;
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
    <div
      className="pc-hero-grid"
      style={{
        padding: 'var(--pc-space-10) var(--pc-screen-pad-lg) 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1.05fr',
        gap: 'var(--pc-space-8)',
        alignItems: 'stretch',
      }}
    >
      {/* Left: headline + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-6)', paddingTop: 'var(--pc-space-6)' }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
          border: '1px solid var(--pc-line)', borderRadius: 999,
          padding: '5px 12px 5px 5px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--pc-sage-hi)', display: 'block', flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
            color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)',
          }}>
            {h.eyebrow}
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-hero)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
          margin: 0,
        }}>
          {h.headline[0]}<br />{h.headline[1]}<br />{h.headline[2]}
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'var(--pc-fg-2)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 400,
          margin: 0,
        }}>
          {h.sub}
        </p>

        {/*
          CTAs — styled <Link> elements, NOT <Link><Button>.
          Nesting a <button> inside an <a> is invalid HTML.
          Button appearance is applied directly to the anchor.
        */}
        <div className="pc-hero-ctas" style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="pc-hero-cta-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'var(--pc-warm)',
              color: 'var(--pc-ink)',
              border: 'none',
              borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              fontWeight: 600,
              letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            Sign Up / Log In
          </button>
        </div>

        {/* Trust strip */}
        <div style={{
          display: 'flex', gap: 'var(--pc-space-6)', paddingTop: 'var(--pc-space-2)',
          borderTop: '1px solid var(--pc-line)',
          flexWrap: 'wrap',
        }}>
          {h.stats.map(([num, label]) => (
            <div key={label}>
              <p style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 'var(--pc-text-lg)',
                color: 'var(--pc-fg)',
                letterSpacing: 'var(--pc-track-tight)',
                lineHeight: 1,
                margin: 0,
              }}>{num}</p>
              <p style={{
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-xs)',
                color: 'var(--pc-fg-3)',
                marginTop: 'var(--pc-space-1)',
                marginBottom: 0,
              }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: photo tiles — desktop only (hidden on mobile via .pc-hero-right CSS) */}
      <div className="pc-hero-right">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-2)', height: 260 }}>
          <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image
              src="/hero-professional-detailer.png"
              alt="Professional detailer foam-gunning a car"
              fill
              priority
              sizes="(max-width: 768px) 1px, 26vw"
              style={{ objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(14,13,11,0.85) 100%)' }} />
            <p style={{
              position: 'absolute', bottom: 12, left: 14, margin: 0,
              fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
              color: 'rgba(255,255,255,0.6)', letterSpacing: 'var(--pc-track-mono)',
            }}>{h.tileCertified}</p>
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image
              src="/hero-booking-app.png"
              alt="Book a wash from your phone"
              fill
              priority
              sizes="(max-width: 768px) 1px, 26vw"
              style={{ objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(14,13,11,0.85) 100%)' }} />
            <p style={{
              position: 'absolute', bottom: 12, left: 14, margin: 0,
              fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
              color: 'rgba(255,255,255,0.6)', letterSpacing: 'var(--pc-track-mono)',
            }}>{h.tileBooking}</p>
          </div>
        </div>

        {/* Process strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--pc-space-2)', marginTop: 'var(--pc-space-2)',
        }}>
          <div style={{
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-4)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 80,
          }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', letterSpacing: 'var(--pc-track-mono)', margin: 0 }}>
              {h.processLabel}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', lineHeight: 1.35, margin: 0 }}>
              {h.processDesc.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
              ))}
            </p>
          </div>
          <div style={{
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-4)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 80,
          }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', letterSpacing: 'var(--pc-track-mono)', margin: 0 }}>
              {h.coverageLabel}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', lineHeight: 1.35, margin: 0 }}>
              {h.coverageDesc.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
    <AuthBottomSheet open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
