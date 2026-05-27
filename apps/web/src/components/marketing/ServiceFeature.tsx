import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';

const SERVICE_IMAGES: Record<string, [string, string]> = {
  '01': ['/service-interior-a.png',  '/service-interior-b.png' ],
  '02': ['/service-exterior-a.png',  '/service-exterior-b.png' ],
  '03': ['/service-coating-a.png',   '/service-coating-b.png'  ],
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
      borderRadius: 20, padding: 'var(--pc-space-8)',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>[SERVICE] [{num}] / {name.toUpperCase()}</Eyebrow>
        <Icon name="arrow-up-right" size={16} color="var(--pc-fg-2)" />
      </div>

      <div
        className="pc-sf-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16, alignItems: 'stretch' }}
      >
        {/* Dual image stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 148 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--pc-line)', position: 'relative' }}>
              {imgA && (
                <Image src={imgA} alt={name} fill style={{ objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,13,11,0.55) 100%)' }} />
            </div>
            <div style={{ height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--pc-line)', position: 'relative' }}>
              {imgB && (
                <Image src={imgB} alt={name} fill style={{ objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,13,11,0.55) 100%)' }} />
            </div>
          </div>
        </div>

        {/* Portrait image */}
        <div className="pc-sf-portrait" style={{ height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--pc-line)', position: 'relative' }}>
          {imgA && (
            <Image src={imgA} alt={name} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(14,13,11,0.5) 100%)' }} />
        </div>

        {/* Price + info */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--pc-space-2) 0', gap: 24 }}>
          <div>
            <Eyebrow>FROM</Eyebrow>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-3xl)', color: '#fff',
              letterSpacing: '-0.02em', marginTop: 'var(--pc-space-1)', lineHeight: 1.05,
            }}>
              {price}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-xl)', color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', lineHeight: 1.55 }}>
              {body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
