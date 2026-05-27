import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';

export default function GalleryPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '120px 56px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 80 }}>
          <Eyebrow>[PORTFOLIO]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
            Before & After.
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
            Seeing is believing. Browse our gallery of paint corrections, ceramic coatings, and extreme interior rehabilitations.
          </p>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {/* Placeholder Gallery Grid */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--pc-card-hi)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, borderRight: '2px solid var(--pc-ink)', width: '50%', background: 'var(--pc-card)' }}>
                  <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 8px', background: 'rgba(14,13,11,0.8)', color: '#fff', fontFamily: 'var(--pc-mono)', fontSize: 10, borderRadius: 4 }}>BEFORE</div>
                </div>
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 8px', background: 'rgba(14,13,11,0.8)', color: '#fff', fontFamily: 'var(--pc-mono)', fontSize: 10, borderRadius: 4 }}>AFTER</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>Porsche 911 GT3</h3>
                <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-sage)' }}>Multi-Stage Correction</span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
