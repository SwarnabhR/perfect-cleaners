import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Perfect Cleaners',
  description: 'Get in touch for questions, custom quotes, or partnerships.',
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '80px 56px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 80 }}>
          {/* Left: Info */}
          <div style={{ flex: 1 }}>
            <Eyebrow>[GET IN TOUCH]</Eyebrow>
            <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 64, color: 'var(--pc-fg)', margin: '16px 0 32px', lineHeight: 1.1 }}>
              We're Here to Help.
            </h1>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, color: 'var(--pc-fg-2)', lineHeight: 1.5, marginBottom: 48 }}>
              Have questions about our services, need a custom quote, or want to discuss a partnership? Drop us a line.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--pc-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="map-pin" size={20} color="var(--pc-sage)" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 600, marginBottom: 4 }}>Visit Our Centre</h3>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
                    B-204 Industrial Area<br />
                    Kavi Nagar, Ghaziabad<br />
                    UP 201002
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--pc-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="phone" size={20} color="var(--pc-sage)" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 600, marginBottom: 4 }}>Call Us</h3>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
                    +91 98765 43210<br />
                    Mon-Sun: 9:00 AM - 9:00 PM
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--pc-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="mail" size={20} color="var(--pc-sage)" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 600, marginBottom: 4 }}>Email Us</h3>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>
                    hello@perfectcleaners.in
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
              <Image src="/contact-hero.png" alt="Contact Us" fill style={{ objectFit: 'cover' }} />
            </div>
            <Card style={{ padding: 40 }}>
              <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginBottom: 24 }}>Send a Message</h2>
              <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', textTransform: 'uppercase' }}>Full Name</label>
                  <input type="text" style={{ padding: 16, borderRadius: 8, background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', textTransform: 'uppercase' }}>Email Address</label>
                  <input type="email" style={{ padding: 16, borderRadius: 8, background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', textTransform: 'uppercase' }}>Message</label>
                  <textarea rows={5} style={{ padding: 16, borderRadius: 8, background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14, resize: 'none' }} />
                </div>
                <button type="button" style={{
                  padding: '16px 24px', borderRadius: 999,
                  background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                  fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: 'pointer', marginTop: 8
                }}>Send Message</button>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
