import Link from 'next/link';
import Image from 'next/image';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Eyebrow from '@/components/ui/Eyebrow';

export default function CTASection() {
  return (
    <div style={{
      margin: 'var(--pc-space-20) var(--pc-screen-pad-lg) 0',
      position: 'relative',
      borderRadius: 'var(--pc-radius-xl)',
      overflow: 'hidden',
      minHeight: 300,
      border: '1px solid var(--pc-line)',
    }}>
      {/* Background photo — water beading on waxed paint */}
      <Image
        src="/service-exterior-b.png"
        alt=""
        aria-hidden="true"
        fill
        style={{ objectFit: 'cover' }}
      />
      {/* Left-side gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(14,13,11,0.97) 30%, rgba(14,13,11,0.6) 60%, rgba(14,13,11,0.1) 100%)',
      }} />
      {/* Content */}
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
        <Eyebrow>[READY IN 2 MINUTES]</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-3xl)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          At your driveway<br />or ours. Your call.
        </div>
        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'var(--pc-fg-2)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 360,
          margin: 0,
        }}>
          Pick a date, choose a service, confirm. We handle the rest — products, equipment, and a trained specialist at your door.
        </p>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
          <Link href="/book">
            <PrimaryButton style={{ padding: 'var(--pc-space-4) var(--pc-space-6)' }}>Book Now</PrimaryButton>
          </Link>
          <Link href="/contact">
            <GhostButton style={{ padding: 'var(--pc-space-4) var(--pc-space-6)' }}>Get in Touch</GhostButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
