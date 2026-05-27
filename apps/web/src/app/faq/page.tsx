'use client';
import { useState } from 'react';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const FAQS = [
  { q: "How long does a premium wash take?", a: "A standard premium wash takes between 1.5 to 2 hours depending on the size and condition of the vehicle. We don't rush the process, ensuring a swirl-free finish." },
  { q: "What's the difference between wax and a ceramic coating?", a: "Wax sits on top of the paint and provides 1-3 months of protection. Ceramic coating bonds with the paint at a molecular level, providing a much harder, glossier, and hydrophobic layer that lasts for years." },
  { q: "Do you need access to water and power for mobile detailing?", a: "Yes, our current mobile units require access to a standard electrical outlet and a water spigot. We bring our own high-pressure washer and commercial vacuums." },
  { q: "Can you remove scratches?", a: "We can remove light to medium scratches, swirl marks, and holograms through our paint correction (machine polishing) services. Deep scratches that have penetrated the clear coat cannot be polished out and require repainting." },
  { q: "Do you clean the engine bay?", a: "Yes, we offer engine bay cleaning as a standalone service or as an add-on. We use specialized degreasers and low-pressure water to safely clean the area, followed by a dressing for plastics." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column', color: 'white' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader 
          badgeText="[FAQ]"
          title="Common Questions."
          subtitle="Everything you need to know about our services, process, and bookings."
        />
        <div style={{ padding: '24px 56px 80px', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQS.map((faq, i) => (
            <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{ 
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '24px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: 'white'
                }}
              >
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg)', fontWeight: 500 }}>{faq.q}</h3>
                <Icon name={openIndex === i ? 'minus' : 'plus'} size={20} color="var(--pc-fg-3)" />
              </button>
              {openIndex === i && (
                <div style={{ padding: '0 24px 24px' }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
