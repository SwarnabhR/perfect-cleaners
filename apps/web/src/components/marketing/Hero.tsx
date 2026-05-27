'use client';

import Link from 'next/link';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import CarImage from '@/components/ui/CarImage';
import Image from 'next/image';

export default function Hero() {
  return (
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
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-hero)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          Bringing Your Car&apos;s<br />Shine Back to Life
        </div>
        <div style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'var(--pc-fg-2)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 440,
        }}>
          Professional detailing, advanced technology, and showroom-quality results — at your home, office, or our centre in Ghaziabad.
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

      {/* Right: image tiles */}
      <div className="pc-hero-right">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-2)', height: 250 }}>
          <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image src="/hero-professional-detailer.png" alt="Professional detailer at work" fill style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(14,13,11,0.80) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 'var(--pc-space-3)', left: 'var(--pc-space-3)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', fontWeight: 500 }}>
              Professional<br />Detailers
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image src="/hero-booking-app.png" alt="Book anywhere, anytime" fill style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(14,13,11,0.80) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 'var(--pc-space-3)', left: 'var(--pc-space-3)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', fontWeight: 500 }}>
              Booking<br />anywhere, anytime
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-2)', marginTop: 'var(--pc-space-2)' }}>
          <Card style={{ padding: 'var(--pc-space-3)', minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Eyebrow>[01]</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', maxWidth: 110 }}>
                Mobile Service<br />Available
              </div>
              <Icon name="phone" size={14} color="var(--pc-fg-3)" />
            </div>
          </Card>
          <Card style={{ padding: 'var(--pc-space-3)', minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Eyebrow>[02]</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', maxWidth: 130 }}>
                Trusted by 1,500+<br />Car Owners
              </div>
              <Icon name="users" size={14} color="var(--pc-fg-3)" />
            </div>
          </Card>
        </div>
      </div>

      {/* Wide bento — full width */}
      <div
        className="pc-hero-bento"
        style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 0.8fr 1.6fr', gap: 'var(--pc-space-2)', marginTop: 'var(--pc-space-5)' }}
      >
        <CarImage tone="light" label="ATTENTION TO DETAIL" style={{ minHeight: 220 }} />
        <CarImage tone="dark" style={{ minHeight: 220 }} />
        <CarImage tone="sage" style={{ minHeight: 220 }} />
      </div>
    </div>
  );
}
