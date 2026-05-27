'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';

const SERVICES = [
  {
    label: 'EXTERIOR WASH',
    title: 'Foam cannon\nto finish',
    img: '/service-exterior-a.png',
    alt: 'Foam cannon exterior wash',
  },
  {
    label: 'EXTERIOR DETAIL',
    title: 'Clay bar, polish,\npaint sealant',
    img: '/service-exterior-b.png',
    alt: 'Water beading on waxed paint',
  },
  {
    label: 'INTERIOR CLEAN',
    title: 'Vacuum, glass,\ntrims done right',
    img: '/service-interior-a.png',
    alt: 'Interior cleaning',
  },
  {
    label: 'INTERIOR DETAIL',
    title: 'Leather condition,\nodour eliminated',
    img: '/service-interior-b.png',
    alt: 'Interior detailing — dashboard and trim',
  },
  {
    label: 'CERAMIC COATING',
    title: '9H hardness,\n3-year protection',
    img: '/service-coating-a.png',
    alt: 'Ceramic coating application',
  },
  {
    label: 'PAINT PROTECTION',
    title: 'Mirror-gloss,\nswirl-free',
    img: '/service-coating-b.png',
    alt: 'Mirror-gloss reflection on coated paint',
  },
];

export default function PremiumSection() {
  return (
    <div
      className="pc-premium-root"
      style={{
        margin: 'var(--pc-space-8) var(--pc-screen-pad-lg) 0',
        background: 'var(--pc-sage)',
        borderRadius: 'var(--pc-radius-xl)',
        padding: 'var(--pc-space-8) var(--pc-space-8) var(--pc-space-6)',
      }}
    >
      {/* Header */}
      <div
        className="pc-premium-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--pc-space-6)',
          marginBottom: 'var(--pc-space-8)',
        }}
      >
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-2xl)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          maxWidth: 520,
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          Six services.<br />One obsessive standard.
        </div>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexShrink: 0, flexWrap: 'wrap' }}>
          <Link href="/book">
            <PrimaryButton style={{ padding: 'var(--pc-space-3) var(--pc-space-6)' }}>Book Now</PrimaryButton>
          </Link>
          <Link href="/services">
            <GhostButton style={{ padding: 'var(--pc-space-3) var(--pc-space-6)' }}>All Services</GhostButton>
          </Link>
        </div>
      </div>

      {/* Service tiles */}
      <div
        className="pc-premium-tiles"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--pc-space-2)' }}
      >
        {SERVICES.map((svc, i) => (
          <div key={svc.label} style={{
            borderRadius: 'var(--pc-radius-md)',
            minHeight: 160,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Photo */}
            <Image
              src={svc.img}
              alt={svc.alt}
              fill
              style={{ objectFit: 'cover' }}
            />
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(14,13,11,0.15) 0%, rgba(14,13,11,0.78) 100%)',
            }} />
            {/* Index */}
            <div style={{
              position: 'relative',
              padding: 'var(--pc-space-4) var(--pc-space-4) 0',
              fontFamily: 'var(--pc-mono)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: 'var(--pc-track-mono)',
            }}>
              [{String(i + 1).padStart(2, '0')}] {svc.label}
            </div>
            {/* Title */}
            <div style={{
              position: 'relative',
              padding: '0 var(--pc-space-4) var(--pc-space-4)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              color: 'var(--pc-fg)',
              lineHeight: 'var(--pc-lh-snug)',
            }}>
              {svc.title.split('\n').map((line, j, arr) => (
                <span key={j}>{line}{j < arr.length - 1 ? <br /> : null}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
