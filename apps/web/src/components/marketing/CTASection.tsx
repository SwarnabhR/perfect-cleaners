import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Eyebrow from '@/components/ui/Eyebrow';
import CarImage from '@/components/ui/CarImage';

export default function CTASection() {
  return (
    <div style={{
      margin: '80px 56px 0', position: 'relative', borderRadius: 24, overflow: 'hidden',
      minHeight: 280, border: '1px solid var(--pc-line)',
    }}>
      <CarImage tone="dark" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(14,13,11,0.95) 35%, rgba(14,13,11,0.4) 65%, rgba(14,13,11,0.0) 100%)',
      }} />
      <div style={{ position: 'relative', padding: '48px 40px', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Eyebrow>[BOOK NOW]</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)', fontSize: 48, lineHeight: 1.05,
          color: '#fff', letterSpacing: '-0.02em',
        }}>
          Book Your Premium Car Wash Today
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryButton style={{ padding: '14px 26px' }}>Book Now</PrimaryButton>
          <GhostButton style={{ padding: '13px 24px' }}>Contact Us</GhostButton>
        </div>
      </div>
    </div>
  );
}
