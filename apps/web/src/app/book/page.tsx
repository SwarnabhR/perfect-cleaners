import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Service | Perfect Cleaners',
  description: 'Schedule your premium car wash and detailing service online.',
};

export default function BookPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '80px 56px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 64 }}>
          {/* Left: Form */}
          <div style={{ flex: 1 }}>
            <Eyebrow>[BOOK A SERVICE]</Eyebrow>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', margin: '8px 0 32px' }}>
              Schedule Your Detail.
            </h1>
            
            <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 40, border: '1px solid var(--pc-line)' }}>
              <Image src="/booking-preview.png" alt="Booking app preview" fill style={{ objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <section>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>1. Select Service</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['Exterior Wash', 'Premium Wash', 'Interior Detail', 'Ceramic Coating'].map((s, i) => (
                    <button key={s} style={{
                      padding: 16, borderRadius: 12, border: `1px solid ${i===0 ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                      background: i===0 ? 'var(--pc-sage-lo)' : 'var(--pc-card)',
                      color: i===0 ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                      fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left'
                    }}>{s}</button>
                  ))}
                </div>
              </section>

              <section>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>2. Select Date & Time</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  {['Mon 28', 'Tue 29', 'Wed 30', 'Thu 31'].map((d, i) => (
                    <button key={d} style={{
                      flex: 1, padding: '12px 0', borderRadius: 8, border: `1px solid ${i===1 ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                      background: i===1 ? 'var(--pc-sage-lo)' : 'var(--pc-card)',
                      color: i===1 ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                      fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                    }}>{d}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((t, i) => (
                    <button key={t} style={{
                      padding: '10px 0', borderRadius: 8, border: `1px solid ${i===2 ? 'var(--pc-sage)' : 'var(--pc-line)'}`,
                      background: i===2 ? 'var(--pc-sage-lo)' : 'var(--pc-card)',
                      color: i===2 ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                      fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                    }}>{t}</button>
                  ))}
                </div>
              </section>

              <section>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', marginBottom: 16 }}>3. Location & Vehicle</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input placeholder="Your Address" style={{
                    width: '100%', padding: 16, borderRadius: 8, border: '1px solid var(--pc-line)',
                    background: 'var(--pc-card)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14
                  }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input placeholder="Make (e.g. BMW)" style={{
                      flex: 1, padding: 16, borderRadius: 8, border: '1px solid var(--pc-line)',
                      background: 'var(--pc-card)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14
                    }} />
                    <input placeholder="Model (e.g. 3 Series)" style={{
                      flex: 1, padding: 16, borderRadius: 8, border: '1px solid var(--pc-line)',
                      background: 'var(--pc-card)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14
                    }} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right: Summary */}
          <div style={{ width: 340 }}>
            <div style={{ position: 'sticky', top: 120 }}>
              <Card style={{ padding: 24 }}>
                <Eyebrow style={{ marginBottom: 16, display: 'block' }}>BOOKING SUMMARY</Eyebrow>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>Exterior Wash</span>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 14, color: 'var(--pc-fg)' }}>₹800</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>Platform Fee</span>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 14, color: 'var(--pc-fg)' }}>₹50</span>
                </div>
                <div style={{ borderTop: '1px solid var(--pc-line)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 24, color: 'var(--pc-fg)' }}>₹850</span>
                </div>
                
                <button style={{
                  width: '100%', padding: '16px 0', borderRadius: 999,
                  background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                  fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: 'pointer'
                }}>Proceed to Payment</button>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
