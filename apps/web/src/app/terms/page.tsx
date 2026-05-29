import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Perfect Cleaners — premium car wash and detailing services in Delhi NCR.',
};

const EFFECTIVE = '1 June 2025';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--pc-space-10)' }}>
      <h2 style={{
        fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', fontWeight: 600,
        color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-snug)',
        marginBottom: 'var(--pc-space-4)',
      }}>
        {title}
      </h2>
      <div style={{
        fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
        color: 'var(--pc-fg-2)', lineHeight: 'var(--pc-lh-loose)',
        display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: 'var(--pc-space-16) var(--pc-space-6) var(--pc-space-20)', width: '100%' }}>

        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', marginBottom: 12 }}>
          [LEGAL]
        </p>
        <h1 style={{
          fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 400, color: 'var(--pc-fg)',
          letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 8,
        }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', marginBottom: 48 }}>
          Effective date: {EFFECTIVE}
        </p>

        <Section title="1. Acceptance of Terms">
          <p>By booking a service, creating an account, or using the Perfect Cleaners website or mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          <p>Perfect Cleaners ("we," "our," or "us") reserves the right to modify these terms at any time. Continued use of our services following any changes constitutes your acceptance of the revised terms.</p>
        </Section>

        <Section title="2. Services">
          <p>Perfect Cleaners provides professional car washing, detailing, and protection services in Delhi NCR including Delhi, Noida, Gurgaon, Ghaziabad, and Faridabad. Service availability, pricing, and scheduling are subject to change without notice.</p>
          <p>We reserve the right to decline or cancel any booking at our discretion, including where a vehicle is deemed unsuitable for the requested service, or where the booking location is outside our service area.</p>
        </Section>

        <Section title="3. Bookings and Payments">
          <p>All bookings are subject to availability. A booking is confirmed only upon receipt of a confirmation message from us via WhatsApp or email. The platform fee (₹50) is non-refundable.</p>
          <p>Payment is due at the time of service or as specified during checkout. We accept UPI, credit/debit cards, and net banking through our payment partners.</p>
          <p>Prices listed on the platform are estimates. Final pricing may vary based on vehicle condition, size, and the specific services performed.</p>
        </Section>

        <Section title="4. Cancellations and Rescheduling">
          <p>You may cancel or reschedule a booking up to 24 hours before the scheduled time at no charge. Cancellations made within 24 hours of the appointment may be subject to a cancellation fee of up to ₹200.</p>
          <p>No-shows (failure to be present at the scheduled time without prior notice) will be charged the full service amount.</p>
        </Section>

        <Section title="5. Vehicle Condition and Liability">
          <p>You confirm that you are the owner of the vehicle or have the authority to authorise work on it. You are responsible for removing all personal belongings from the vehicle before service.</p>
          <p>Perfect Cleaners takes all reasonable precautions to protect your vehicle. However, we are not liable for pre-existing damage, mechanical issues, or defects discovered during the service. We will photograph your vehicle before and after every service as a record.</p>
          <p>Our maximum liability for any damage caused by our negligence is limited to the cost of the service performed. We are not liable for consequential or indirect losses.</p>
        </Section>

        <Section title="6. User Conduct">
          <p>You agree not to use our platform for any unlawful purpose, to provide accurate booking information, and not to misuse promotional offers or referral codes.</p>
          <p>Abusive, threatening, or inappropriate behaviour towards our staff will result in immediate termination of service and may be reported to law enforcement.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>All content on the Perfect Cleaners platform — including text, graphics, logos, and images — is owned by Perfect Cleaners or its licensors and may not be reproduced without written permission.</p>
        </Section>

        <Section title="8. Governing Law">
          <p>These terms are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Ghaziabad, Uttar Pradesh.</p>
        </Section>

        <Section title="9. Contact">
          <p>For questions about these Terms of Service, please contact us at <a href="mailto:hello@perfectcleaners.in" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>hello@perfectcleaners.in</a> or call <a href="tel:+919876543210" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>+91 98765 43210</a>.</p>
        </Section>

      </main>
      <Footer />
    </div>
  );
}
