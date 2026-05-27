import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

export default function MembershipPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '120px 56px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 80 }}>
          <Eyebrow>[MEMBERSHIP]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
            Keep it Perfect.
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
            Join our exclusive maintenance club. Regular, discounted details for those who demand their vehicle looks its best, year-round.
          </p>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Tier 1 */}
          <Card style={{ padding: 40, border: '1px solid var(--pc-line)' }}>
            <Eyebrow style={{ marginBottom: 8, display: 'block' }}>ESSENTIAL</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', marginBottom: 8 }}>₹2,500<span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-3)', marginLeft: 8 }}>/mo</span></div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', marginBottom: 32 }}>Perfect for daily drivers that need a monthly reset.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                '1x Premium Wash per month',
                '1x Basic Interior Wipe down',
                '10% off any additional services',
                'Priority booking slots'
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Icon name="check" size={16} color="var(--pc-fg-3)" />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/book" style={{
              display: 'block', textAlign: 'center', padding: '16px 0', borderRadius: 999,
              background: 'var(--pc-card-hi)', color: 'var(--pc-fg)', border: '1px solid var(--pc-line)',
              fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>Select Essential</Link>
          </Card>

          {/* Tier 2 */}
          <Card style={{ padding: 40, border: '2px solid var(--pc-sage)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--pc-sage)', color: 'var(--pc-ink)', padding: '4px 12px', borderRadius: 999, fontFamily: 'var(--pc-mono)', fontSize: 10, fontWeight: 600 }}>MOST POPULAR</div>
            <Eyebrow style={{ marginBottom: 8, display: 'block', color: 'var(--pc-sage)' }}>ENTHUSIAST</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', marginBottom: 8 }}>₹4,500<span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-3)', marginLeft: 8 }}>/mo</span></div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', marginBottom: 32 }}>For vehicles that command a flawless presence.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                '2x Premium Wash per month',
                '1x Deep Interior Detailing',
                'Monthly spray wax application',
                '20% off Ceramic & PPF',
                'VIP emergency spot cleaning'
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Icon name="check" size={16} color="var(--pc-sage)" />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/book" style={{
              display: 'block', textAlign: 'center', padding: '16px 0', borderRadius: 999,
              background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>Select Enthusiast</Link>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
