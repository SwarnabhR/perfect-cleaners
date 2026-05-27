import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import USP from '@/components/marketing/USP';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

export default function CeramicCoatingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        {/* Hero split layout */}
        <div style={{ padding: '40px 56px 0', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 32, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 22 }}>
            <Eyebrow>[CERAMIC COATING]</Eyebrow>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 64, lineHeight: 1.04,
              color: '#fff', letterSpacing: '-0.02em',
            }}>Armour for Your Paint.</div>
            <div style={{
              fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)',
              lineHeight: 1.5, maxWidth: 440,
            }}>Unlock intense gloss and years of protection. Our nano-ceramic coatings create a hydrophobic barrier against UV, chemicals, and environmental fallout.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/book" style={{
                background: '#fff', color: 'var(--pc-ink)', borderRadius: 999, padding: '14px 26px',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, textDecoration: 'none'
              }}>Book Consultation — From ₹15,000</Link>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--pc-line)', minHeight: 320 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/service-coating-a.png" alt="Ceramic Coating" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <USP />

        {/* Details & Pricing */}
        <section style={{ padding: '80px 56px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
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
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)', lineHeight: 1.4 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Card style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Eyebrow>PRICING TIERS</Eyebrow>
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
              </Card>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 80, marginBottom: 80 }}>
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
