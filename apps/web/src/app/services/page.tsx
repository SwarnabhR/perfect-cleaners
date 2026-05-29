import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import ServiceFeature from '@/components/marketing/ServiceFeature';
import PremiumSection from '@/components/marketing/PremiumSection';
import CTASection from '@/components/marketing/CTASection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Premium car wash, interior detailing, and ceramic coating services.',
};

export default function ServicesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, paddingBottom: 80 }}>
        
        <SectionHeader />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ServiceFeature
            num="01" name="Interior Detailing" price="₹1,500 — ₹4,000"
            title="Specialist of Interior Detailing"
            body="We proudly offer a comprehensive refresh and protect your vehicle's interior, ensuring a truly luxurious feel that enhances your driving experience."
          />
          <PremiumSection />
          <ServiceFeature
            num="02" name="Exterior Wash" price="₹800 — ₹2,500"
            title="Gentle Exterior Wash Service"
            body="Bring back your car's shine with our gentle yet thorough exterior wash. We use PH-neutral snow foam and a safe two-bucket wash method."
          />
          <ServiceFeature
            num="03" name="Ceramic Coating" price="₹15,000 — ₹50,000"
            title="Paint Protection & Coating"
            body="Protect your paint with advanced ceramic coatings that deliver lasting shine, hydrophobicity, and defence against the elements."
          />
        </div>
        
        <div style={{ marginTop: 80 }}>
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
