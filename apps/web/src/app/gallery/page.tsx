import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse our portfolio of paint corrections, ceramic coatings, and interior rehabilitations.',
};

const GALLERY_ITEMS = [
  { img: '/gallery-sports-car.png',  title: 'Porsche 911 GT3',      category: 'Multi-Stage Correction' },
  { img: '/gallery-wheel.png',       title: 'Alloy Deep Clean',      category: 'Wheel Off Detailing'    },
  { img: '/gallery-interior.png',    title: 'Leather Rejuvenation',  category: 'Interior Restoration'   },
  { img: '/gallery-water-beads.png', title: 'Hydrophobic Defence',   category: 'Ceramic Coating'        },
  { img: '/gallery-polishing.png',   title: 'Swirl Mark Removal',    category: 'Paint Correction'       },
  { img: '/gallery-dashboard.png',   title: 'Dashboard Refresh',     category: 'Interior Detailing'     },
];

export default function GalleryPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader
          badgeText="[PORTFOLIO]"
          title="Before &amp; After."
          subtitle="Seeing is believing. Browse our gallery of paint corrections, ceramic coatings, and extreme interior rehabilitations."
        />

        <div
          className="pc-gallery-grid"
          style={{
            padding: '24px var(--pc-screen-pad-lg) 80px',
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(16px, 3vw, 32px)',
          }}
        >
          {GALLERY_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: 'var(--pc-card-hi)',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid var(--pc-line)',
              }}>
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg)', fontWeight: 500 }}>
                  {item.title}
                </h3>
                <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-sage-hi)', letterSpacing: 'var(--pc-track-mono)' }}>
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
