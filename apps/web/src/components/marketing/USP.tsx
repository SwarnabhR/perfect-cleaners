import Link from 'next/link';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import CarImage from '@/components/ui/CarImage';

export default function USP() {
  return (
    <div
      className="pc-usp-root"
      style={{
        padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) 0',
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.1fr',
        gap: 'var(--pc-space-10)',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
        <Eyebrow>[KEY USP LIST]</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-3xl)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          Your Car Deserves More than an Ordinary Wash
        </div>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', marginTop: 'var(--pc-space-1)', flexWrap: 'wrap' }}>
          <Link href="/book">
            <PrimaryButton style={{ padding: 'var(--pc-space-3) var(--pc-space-6)' }}>Book Now</PrimaryButton>
          </Link>
          <Link href="/contact">
            <GhostButton style={{ padding: 'var(--pc-space-3) var(--pc-space-6)' }}>Contact Us</GhostButton>
          </Link>
        </div>
      </div>

      <div
        className="pc-usp-cards"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 'var(--pc-space-3)' }}
      >
        <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)', minHeight: 220 }}>
          <Icon name="sparkles" size={20} color="var(--pc-fg)" />
          <div>
            <div style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              color: 'var(--pc-fg)',
              fontWeight: 500,
              lineHeight: 'var(--pc-lh-snug)',
            }}>
              Premium Products<br />&amp; Technology
            </div>
            <div style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-2)',
              lineHeight: 'var(--pc-lh-loose)',
              marginTop: 'var(--pc-space-2)',
            }}>
              Highly skilled team dedicated to meticulous detailing with industry-leading products.
            </div>
          </div>
        </Card>
        <Card style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)', minHeight: 220 }}>
          <Icon name="shield" size={20} color="var(--pc-fg)" />
          <div>
            <div style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              color: 'var(--pc-fg)',
              fontWeight: 500,
              lineHeight: 'var(--pc-lh-snug)',
            }}>
              Safe Paint-Friendly<br />Process
            </div>
            <div style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-2)',
              lineHeight: 'var(--pc-lh-loose)',
              marginTop: 'var(--pc-space-2)',
            }}>
              Our techniques protect your paintwork from swirl marks, scratches, and harsh chemicals.
            </div>
          </div>
        </Card>
        <CarImage className="pc-usp-car" tone="dark" style={{ minHeight: 220 }} />
      </div>
    </div>
  );
}
