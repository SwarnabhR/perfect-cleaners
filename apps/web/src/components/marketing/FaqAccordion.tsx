'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { useI18n } from '@/i18n';

export default function FaqAccordion() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ padding: 'var(--pc-space-6) var(--pc-screen-pad-lg) var(--pc-space-20)', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
      {t.faqPage.items.map((faq, i) => {
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
