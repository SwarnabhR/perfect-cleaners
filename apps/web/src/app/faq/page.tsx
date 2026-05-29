import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about our services, process, and bookings.',
};

export default function FAQPage() {

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column', color: 'white' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader 
          badgeText="[FAQ]"
          title="Common Questions."
          subtitle="Everything you need to know about our services, process, and bookings."
        />
        <FaqAccordion />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
