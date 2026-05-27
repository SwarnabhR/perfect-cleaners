'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const FAQS = [
  { q: "How long does a premium wash take?", a: "A standard premium wash takes between 1.5 to 2 hours depending on the size and condition of the vehicle. We don't rush the process, ensuring a swirl-free finish." },
  { q: "What's the difference between wax and a ceramic coating?", a: "Wax sits on top of the paint and provides 1-3 months of protection. Ceramic coating bonds with the paint at a molecular level, providing a much harder, glossier, and hydrophobic layer that lasts for years." },
  { q: "Do you need access to water and power for mobile detailing?", a: "Yes, our current mobile units require access to a standard electrical outlet and a water spigot. We bring our own high-pressure washer and commercial vacuums." },
  { q: "Can you remove scratches?", a: "We can remove light to medium scratches, swirl marks, and holograms through our paint correction (machine polishing) services. Deep scratches that have penetrated the clear coat cannot be polished out and require repainting." },
  { q: "Do you clean the engine bay?", a: "Yes, we offer engine bay cleaning as a standalone service or as an add-on. We use specialized degreasers and low-pressure water to safely clean the area, followed by a dressing for plastics." },
];

/*
  Smooth height animation via CSS grid-template-rows trick:
  grid-template-rows transitions between '0fr' and '1fr' giving us a
  height animation without needing to know the element's pixel height.
  The inner div needs min-height: 0 to collapse properly.
  Falls back to instant open/close when prefers-reduced-motion is set.
*/

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ padding: 'var(--pc-space-6) var(--pc-screen-pad-lg) var(--pc-space-20)', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        const panelId = `faq-panel-${i}`;
        const triggerId = `faq-trigger-${i}`;

        return (
          <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
            <button
              id={triggerId}
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--pc-space-6)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                color: 'var(--pc-fg)',
              }}
            >
              <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg)', fontWeight: 500 }}>{faq.q}</h3>
              <Icon
                name={isOpen ? 'minus' : 'plus'}
                size={20}
                color="var(--pc-fg-3)"
                style={{
                  flexShrink: 0,
                  transition: 'transform var(--pc-dur-fast) var(--pc-ease)',
                }}
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows var(--pc-dur-base) var(--pc-ease)',
              }}
            >
              <div style={{ minHeight: 0, overflow: 'hidden' }}>
                <p style={{
                  padding: '0 var(--pc-space-6) var(--pc-space-6)',
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-base)',
                  color: 'var(--pc-fg-2)',
                  lineHeight: 1.6,
                }}>
                  {faq.a}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
