import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Perfect Cleaners — how we collect, use, and protect your personal data.',
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

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', marginBottom: 48 }}>
          Effective date: {EFFECTIVE}
        </p>

        <Section title="1. About Us">
          <p>Perfect Cleaners is owned and operated by <strong style={{ color: 'var(--pc-fg)' }}>Anil Kanojiya</strong>, founder and proprietor, with its principal place of business in Ghaziabad, Uttar Pradesh, India. This Privacy Policy explains how we collect, use, and protect your personal data.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>When you use Perfect Cleaners, we collect information you provide directly:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Identity:</strong> Full name, mobile number.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Vehicle:</strong> Make, model, number plate, colour.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Location:</strong> Service address, city, pincode.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Booking history:</strong> Services booked, dates, payments.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Device data:</strong> IP address, browser type, app usage data collected automatically.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use your information to:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Process and confirm your bookings.</li>
            <li>Communicate booking status and updates via WhatsApp and SMS.</li>
            <li>Improve our services and personalise your experience.</li>
            <li>Send promotional offers (you can opt out at any time).</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </Section>

        <Section title="4. Data Sharing">
          <p>We share your data only as necessary to deliver our services:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Service technicians:</strong> Name, vehicle details, and address to carry out the booking.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Payment processors:</strong> Razorpay handles payments; we do not store card numbers.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>SMS / OTP providers:</strong> MSG91 to verify your mobile number during sign-in.</li>
            <li><strong style={{ color: 'var(--pc-fg)' }}>Analytics:</strong> Aggregated, anonymised usage data with Vercel Analytics.</li>
          </ul>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>Your data is stored on Google Firebase servers located in the asia-south1 (Mumbai) region. We use industry-standard encryption for data in transit (TLS) and at rest.</p>
          <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.</p>
        </Section>

        <Section title="6. Cookies and Tracking">
          <p>Our website uses minimal cookies necessary for authentication and session management. We use Vercel Analytics for anonymous, privacy-respecting traffic analysis — no personal data is used for advertising tracking.</p>
          <p>You can disable cookies in your browser settings; this may affect the functionality of our platform.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Under applicable Indian data protection law, you have the right to:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate or incomplete data.</li>
            <li>Request deletion of your personal data.</li>
            <li>Opt out of marketing communications at any time.</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:hello@perfectcleaners.in" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>hello@perfectcleaners.in</a>.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>Our services are not directed at children under 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with data, please contact us immediately.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes via the app or email. Continued use of our services after such notice constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="10. Contact">
          <p>For privacy-related questions or requests, contact <strong style={{ color: 'var(--pc-fg)' }}>Anil Kanojiya</strong> (Founder & Owner) at <a href="mailto:hello@perfectcleaners.in" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>hello@perfectcleaners.in</a> or call <a href="tel:+9197711241629" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>+91 97711241629</a>, or write to us at our registered address in Ghaziabad, Uttar Pradesh.</p>
        </Section>

      </main>
      <Footer />
    </div>
  );
}
