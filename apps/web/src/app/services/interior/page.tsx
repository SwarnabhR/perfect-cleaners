import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

export default function InteriorDetailingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ padding: '120px 56px', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Eyebrow>[INTERIOR DETAILING]</Eyebrow>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
              Revive Your Cabin.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5, marginBottom: 40 }}>
              Deep cleaning, stain removal, and protective conditioning for every surface inside your vehicle. 
              Because what matters most is the space you inhabit.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/book" style={{
                padding: '14px 28px', borderRadius: 999,
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
              }}>Book Now — From ₹1,500</Link>
            </div>
          </div>
        </section>

        {/* Details */}
        <section style={{ padding: '0 56px 120px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
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
