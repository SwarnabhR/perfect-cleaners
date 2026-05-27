import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';

const SERVICE_IMAGES: Record<string, [string, string]> = {
  '01': ['/service-interior-a.png',  '/service-interior-b.png'],
  '02': ['/service-exterior-a.png',  '/service-exterior-b.png'],
  '03': ['/service-coating-a.png',   '/service-coating-b.png'],
};

interface ServiceFeatureProps {
  num: string;
  name: string;
  price: string;
  title: string;
  body: string;
}

export default function ServiceFeature({ num, name, price, title, body }: ServiceFeatureProps) {
  const [imgA, imgB] = SERVICE_IMAGES[num] ?? [null, null];

  return (
    <div style={{
      margin: '0 var(--pc-screen-pad-lg)',
      background: 'var(--pc-card)',
      border: '1px solid var(--pc-line)',
      borderRadius: 'var(--pc-radius-lg)',
      padding: 'var(--pc-space-8)',
      display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-6)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>[SERVICE] [{num}] / {name.toUpperCase()}</Eyebrow>
        <Icon name="arrow-up-right" size={16} color="var(--pc-fg-2)" />
      </div>

      <div
        className="pc-sf-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 'var(--pc-space-4)', alignItems: 'stretch' }}
      >
        {/* Dual image stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)', minHeight: 148 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-2)' }}>
            <div style={{ height: 140, borderRadius: 'var(--pc-radius-sm)', overflow: 'hidden', border: '1px solid var(--pc-line)', position: 'relative' }}>
              {imgA && <Image src={imgA} alt={name} fill style={{ objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,13,11,0.55) 100%)' }} />
            </div>
            <div style={{ height: 140, borderRadius: 'var(--pc-radius-sm)', overflow: 'hidden', border: '1px solid var(--pc-line)', position: 'relative' }}>
              {imgB && <Image src={imgB} alt={name} fill style={{ objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,13,11,0.55) 100%)' }} />
            </div>
          </div>
        </div>

        {/* Portrait image */}
        <div className="pc-sf-portrait" style={{ height: 280, borderRadius: 'var(--pc-radius-sm)', overflow: 'hidden', border: '1px solid var(--pc-line)', position: 'relative' }}>
          {imgA && <Image src={imgA} alt={name} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(14,13,11,0.5) 100%)' }} />
        </div>

        {/* Price + info */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--pc-space-2) 0', gap: 'var(--pc-space-6)' }}>
          <div>
            <Eyebrow>FROM</Eyebrow>
            <div style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 'var(--pc-text-3xl)',
              color: 'var(--pc-fg)',
              letterSpacing: 'var(--pc-track-tight)',
              marginTop: 'var(--pc-space-1)',
              lineHeight: 'var(--pc-lh-tight)',
            }}>
              {price}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
            <div style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 'var(--pc-text-xl)',
              color: 'var(--pc-fg)',
              letterSpacing: 'var(--pc-track-snug)',
              lineHeight: 'var(--pc-lh-snug)',
            }}>
              {title}
            </div>
            <div style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              color: 'var(--pc-fg-2)',
              lineHeight: 'var(--pc-lh-body)',
            }}>
              {body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
