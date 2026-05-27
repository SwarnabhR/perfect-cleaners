import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

export default function ExteriorWashPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <section style={{ padding: '120px 56px', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Eyebrow>[EXTERIOR WASH]</Eyebrow>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
              Safe, Scratch-Free Shine.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5, marginBottom: 40 }}>
              Our multi-stage wash process ensures all dirt is safely lifted and removed without inducing swirl marks. We finish with a high-gloss sealant.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/book" style={{
                padding: '14px 28px', borderRadius: 999,
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
              }}>Book Now — From ₹800</Link>
            </div>
          </div>
        </section>

        <section style={{ padding: '0 56px 120px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', marginBottom: 24 }}>What's Included</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Alloy wheel deep clean and tire scrub',
                  'Citrus pre-wash bug and grime removal',
                  'Thick snow foam blanket soak',
                  'Two-bucket safe hand wash',
                  'Plush microfiber towel drying',
                  'Tire dressing application',
                  'Exterior glass streak-free finish'
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
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>Est. 1 hour</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹800</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--pc-line)', paddingBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>Compact SUV</div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>Est. 1.5 hours</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹1,000</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>Large SUV / MUV</div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>Est. 1.5-2 hours</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>₹1,200</div>
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
