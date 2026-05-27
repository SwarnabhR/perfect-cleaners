'use client';
import { useState } from 'react';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
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
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '120px 56px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 80 }}>
          <Eyebrow>[FAQ]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 24px', lineHeight: 1.1 }}>
            Common Questions.
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
            Everything you need to know about our services, process, and bookings.
          </p>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--pc-line)' }}>
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{ 
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '24px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, color: 'var(--pc-fg)', fontWeight: 500 }}>{faq.q}</h3>
                <Icon name={openIndex === i ? 'minus' : 'plus'} size={20} color="var(--pc-fg-3)" />
              </button>
              {openIndex === i && (
                <div style={{ paddingBottom: 24 }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
