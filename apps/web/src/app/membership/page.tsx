import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import MembershipCards from './MembershipCards';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Membership',
  description: 'Join our exclusive maintenance club for regular, discounted details.',
};

export default function MembershipPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader
          badgeText="[MEMBERSHIP]"
          title="Keep it Perfect."
          subtitle="Join our exclusive maintenance club. Regular, discounted details for those who demand their vehicle looks its best, year-round."
        />
        <MembershipCards />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
