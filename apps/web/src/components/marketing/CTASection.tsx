'use client';

import Link from 'next/link';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Eyebrow from '@/components/ui/Eyebrow';
import CarImage from '@/components/ui/CarImage';

export default function CTASection() {
  return (
    <div style={{
      margin: 'var(--pc-space-20) var(--pc-screen-pad-lg) 0',
      position: 'relative',
      borderRadius: 'var(--pc-radius-xl)',
      overflow: 'hidden',
      minHeight: 280,
      border: '1px solid var(--pc-line)',
    }}>
      <CarImage tone="dark" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(14,13,11,0.95) 35%, rgba(14,13,11,0.4) 65%, rgba(14,13,11,0.0) 100%)',
      }} />
      <div
        className="pc-cta-inner"
        style={{
          position: 'relative',
          padding: 'var(--pc-space-12) var(--pc-space-10)',
          maxWidth: 600,
          display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)',
        }}
      >
        <Eyebrow>[BOOK NOW]</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-3xl)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          Book Your Premium<br />Car Wash Today
        </div>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
          <Link href="/book">
            <PrimaryButton style={{ padding: 'var(--pc-space-4) var(--pc-space-6)' }}>Book Now</PrimaryButton>
          </Link>
          <Link href="/contact">
            <GhostButton style={{ padding: 'var(--pc-space-4) var(--pc-space-6)' }}>Contact Us</GhostButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
