import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import ContactForm from './ContactForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Perfect Cleaners',
  description: 'Get in touch for questions, custom quotes, or partnerships.',
};

const CONTACT_ITEMS = [
  {
    icon: 'map-pin',
    label: 'Visit Our Centre',
    lines: ['B-204 Industrial Area', 'Kavi Nagar, Ghaziabad', 'UP 201002'],
  },
  {
    icon: 'phone',
    label: 'Call Us',
    lines: ['+91 98765 43210', 'Mon–Sun: 9:00 AM – 9:00 PM IST'],
  },
  {
    icon: 'mail',
    label: 'Email Us',
    lines: ['hello@perfectcleaners.in'],
  },
] as const;

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main
        className="pc-contact-main"
        style={{ flex: 1, padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)' }}
      >
        <div
          className="pc-contact-layout"
          style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', gap: 'var(--pc-space-20)', alignItems: 'flex-start' }}
        >

          {/* ── Left: info ── */}
          <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)' }}>
            <div>
              <Eyebrow>[GET IN TOUCH]</Eyebrow>
              <h1 style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 'var(--pc-text-3xl)',
                color: 'var(--pc-fg)',
                margin: 'var(--pc-space-4) 0 var(--pc-space-6)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}>
                We&apos;re Here<br />to Help.
              </h1>
              <p style={{
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-base)',
                color: 'var(--pc-fg-2)',
                lineHeight: 1.6,
              }}>
                Questions about our services, need a custom quote, or want to discuss a partnership? Drop us a line.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-6)' }}>
              {CONTACT_ITEMS.map(({ icon, label, lines }) => (
                <div key={label} style={{ display: 'flex', gap: 'var(--pc-space-4)', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, flexShrink: 0,
                    borderRadius: 'var(--pc-radius-pill)',
                    background: 'var(--pc-card)',
                    border: '1px solid var(--pc-line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={icon} size={18} color="var(--pc-sage-hi)" />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 'var(--pc-text-sm)',
                      color: 'var(--pc-fg)',
                      fontWeight: 600,
                      marginBottom: 'var(--pc-space-1)',
                    }}>
                      {label}
                    </div>
                    {lines.map(l => (
                      <div key={l} style={{
                        fontFamily: 'var(--pc-sans)',
                        fontSize: 'var(--pc-text-sm)',
                        color: 'var(--pc-fg-2)',
                        lineHeight: 1.6,
                      }}>{l}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--pc-line)', paddingTop: 'var(--pc-space-6)' }}>
              <Eyebrow>HOURS</Eyebrow>
              <div style={{ marginTop: 'var(--pc-space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
                {[
                  ['Monday – Friday', '9:00 AM – 9:00 PM'],
                  ['Saturday', '8:00 AM – 10:00 PM'],
                  ['Sunday', '10:00 AM – 7:00 PM'],
                ].map(([day, time]) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>{day}</span>
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', letterSpacing: '0.06em' }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: form ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
