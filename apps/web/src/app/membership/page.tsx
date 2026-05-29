import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Membership',
  description: 'Join our exclusive maintenance club for regular, discounted details.',
};

export default function MembershipPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column', color: 'white' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader 
          badgeText="[MEMBERSHIP]"
          title="Keep it Perfect."
          subtitle="Join our exclusive maintenance club. Regular, discounted details for those who demand their vehicle looks its best, year-round."
        />
        <div style={{ padding: '24px 56px 80px', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {/* Tier 1 */}
          <Card style={{ padding: 40, border: '1px solid var(--pc-line)', display: 'flex', flexDirection: 'column' }}>
            <Eyebrow style={{ marginBottom: 8, display: 'block' }}>ESSENTIAL</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', marginBottom: 8 }}>₹2,500<span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-3)', marginLeft: 8 }}>/mo</span></div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', marginBottom: 32 }}>Perfect for daily drivers that need a monthly reset.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
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
              display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 999,
              background: 'transparent', color: 'var(--pc-fg)', border: '1px solid var(--pc-line-strong)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>Select Essential</Link>
          </Card>

          {/* Tier 2 */}
          <Card style={{ padding: 40, border: '1px solid var(--pc-sage)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--pc-sage)', color: 'var(--pc-ink)', padding: '4px 12px', borderRadius: 999, fontFamily: 'var(--pc-mono)', fontSize: 10, fontWeight: 600 }}>MOST POPULAR</div>
            <Eyebrow style={{ marginBottom: 8, display: 'block', color: 'var(--pc-sage)' }}>ENTHUSIAST</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', marginBottom: 8 }}>₹4,500<span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-3)', marginLeft: 8 }}>/mo</span></div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', marginBottom: 32 }}>For vehicles that command a flawless presence.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
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
              display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 999,
              background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>Select Enthusiast</Link>
          </Card>

          {/* Tier 3 */}
          <Card style={{ padding: 40, border: '1px solid var(--pc-line)', display: 'flex', flexDirection: 'column' }}>
            <Eyebrow style={{ marginBottom: 8, display: 'block' }}>OBSESSIVE</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 48, color: 'var(--pc-fg)', marginBottom: 8 }}>₹8,000<span style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-3)', marginLeft: 8 }}>/mo</span></div>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', marginBottom: 32 }}>The ultimate package for show cars and exotics.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {[
                'Weekly Premium Wash',
                'Bi-weekly Deep Interior',
                'Quarterly Ceramic Boost',
                '30% off any additional services',
                'Free pickup and delivery'
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Icon name="check" size={16} color="var(--pc-fg-3)" />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/book" style={{
              display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 999,
              background: 'transparent', color: 'var(--pc-fg)', border: '1px solid var(--pc-line-strong)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>Select Obsessive</Link>
          </Card>
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
