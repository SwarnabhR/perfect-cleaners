'use client';

import Link from 'next/link';
import Image from 'next/image';
import Eyebrow from '@/components/ui/Eyebrow';
import { useI18n } from '@/i18n';

export default function CTASection() {
  const { t } = useI18n();
  const c = t.cta;

  return (
    <div style={{
      margin: 'var(--pc-space-20) var(--pc-screen-pad-lg) 0',
      position: 'relative',
      borderRadius: 'var(--pc-radius-xl)',
      overflow: 'hidden',
      minHeight: 300,
      border: '1px solid var(--pc-line)',
    }}>
      <Image
        src="/service-exterior-b.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(14,13,11,0.97) 30%, rgba(14,13,11,0.6) 60%, rgba(14,13,11,0.1) 100%)',
      }} />
      <div
        className="pc-cta-inner"
        style={{
          position: 'relative',
          padding: 'var(--pc-space-12) var(--pc-space-10)',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--pc-space-5)',
        }}
      >
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-3xl)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          {c.headline1}<br />{c.headline2}
        </div>
        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 360,
          margin: 0,
        }}>
          {c.body}
        </p>
        <div className="pc-cta-btns" style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
          <Link
            href="/plans"
            className="pc-hero-cta-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              border: 'none', borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
              fontWeight: 600, letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {c.bookNow}
          </Link>
          <Link
            href="/for-societies"
            className="pc-hero-cta-ghost"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'transparent', color: 'var(--pc-fg)',
              border: '1px solid currentColor', borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
              fontWeight: 500, letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {c.getInTouch}
          </Link>
        </div>
      </div>
    </div>
  );
}
