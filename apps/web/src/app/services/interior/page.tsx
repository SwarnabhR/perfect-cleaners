import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import USP from '@/components/marketing/USP';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

export default function InteriorDetailingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        {/* Hero split layout */}
        <div style={{ padding: '40px 56px 0', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 32, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 22 }}>
            <Eyebrow>[INTERIOR DETAILING]</Eyebrow>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 64, lineHeight: 1.04,
              color: '#fff', letterSpacing: '-0.02em',
            }}>Revive Your Cabin.</div>
            <div style={{
              fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)',
              lineHeight: 1.5, maxWidth: 440,
            }}>Deep cleaning, stain removal, and protective conditioning for every surface inside your vehicle. Because what matters most is the space you inhabit.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/book" style={{
                background: '#fff', color: 'var(--pc-ink)', borderRadius: 999, padding: '14px 26px',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, textDecoration: 'none'
              }}>Book Now — From ₹1,500</Link>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--pc-line)', minHeight: 320 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/service-interior-a.png" alt="Interior Detailing" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <USP />

        {/* Details & Pricing */}
        <section style={{ padding: '80px 56px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', marginBottom: 24 }}>What's Included</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Deep vacuuming of carpets, seats, and boot',
                  'Steam cleaning of air vents and crevices',
                  'Leather cleaning and conditioning',
                  'Fabric seat shampoo and extraction',
                  'Dashboard and door panel UV protection',
                  'Interior glass streak-free cleaning',
                  'Odor neutralization treatment'
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
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>Hatchback / Sedan</div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>Est. 2-3 hours</div>
                  </div>
                  <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹1,500</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--pc-line)', paddingBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>Compact SUV</div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>Est. 3-4 hours</div>
                  </div>
                  <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹2,000</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>Large SUV / MUV</div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>Est. 4-5 hours</div>
                  </div>
                  <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹2,500</div>
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
