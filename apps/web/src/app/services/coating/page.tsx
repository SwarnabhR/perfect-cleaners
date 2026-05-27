import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

export default function CeramicCoatingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <section style={{ padding: '120px 56px', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Eyebrow>[CERAMIC COATING]</Eyebrow>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
              Armour for Your Paint.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5, marginBottom: 40 }}>
              Unlock intense gloss and years of protection. Our nano-ceramic coatings create a hydrophobic barrier against UV, chemicals, and environmental fallout.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/book" style={{
                padding: '14px 28px', borderRadius: 999,
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
              }}>Book Consultation — From ₹15,000</Link>
            </div>
          </div>
        </section>

        <section style={{ padding: '0 56px 120px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', marginBottom: 24 }}>The Process</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Extensive decontamination wash & iron removal',
                  'Clay bar treatment for smooth surface',
                  'Single-stage machine polish (paint enhancement)',
                  'IPA panel wipe for perfectly bare paint',
                  'Professional-grade ceramic coating application',
                  'Infrared curing process',
                  'Final inspection and gloss verification'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ padding: 4, background: 'var(--pc-sage-lo)', borderRadius: '50%', color: 'var(--pc-sage)' }}>
                      <Icon name="check" size={14} />
                    </div>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-2)', lineHeight: 1.4 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Card style={{ padding: 32 }}>
                <Eyebrow style={{ marginBottom: 16, display: 'block' }}>PRICING TIERS</Eyebrow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--pc-line)', paddingBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>3-Year Coating (Hatchback/Sedan)</div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>1 layer · 1-day turnaround</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹15,000</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--pc-line)', paddingBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>5-Year Coating (Hatchback/Sedan)</div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>2 layers · 2-day turnaround</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹25,000</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>7-Year Graphene (All Sizes)</div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>3 layers · Multi-stage correction</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>From ₹40k</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
