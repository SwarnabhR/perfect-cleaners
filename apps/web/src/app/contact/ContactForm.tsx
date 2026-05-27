'use client';

import Card from '@/components/ui/Card';

export default function ContactForm() {
  return (
    <Card style={{ padding: 'var(--pc-space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--pc-serif)',
        fontSize: 'var(--pc-text-2xl)',
        color: 'var(--pc-fg)',
        marginBottom: 'var(--pc-space-8)',
        letterSpacing: '-0.01em',
      }}>
        Send a Message
      </h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

        {/* Name + Phone row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
            <label style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Full Name</label>
            <input type="text" placeholder="Rahul Sharma" className="pc-input" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
            <label style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Phone Number</label>
            <input type="tel" placeholder="+91 98765 43210" className="pc-input" />
          </div>
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
          <label style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-xs)',
            color: 'var(--pc-fg-3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Email Address</label>
          <input type="email" placeholder="rahul@example.com" className="pc-input" />
        </div>

        {/* Service interest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
          <label style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-xs)',
            color: 'var(--pc-fg-3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Service Interest</label>
          <select
            className="pc-input"
            defaultValue=""
            style={{ appearance: 'none', WebkitAppearance: 'none' }}
          >
            <option value="" disabled>Select a service…</option>
            <option value="interior">Interior Detailing</option>
            <option value="exterior">Exterior Wash</option>
            <option value="coating">Paint Protection &amp; Coating</option>
            <option value="membership">Membership Plan</option>
            <option value="other">Other / General Enquiry</option>
          </select>
        </div>

        {/* Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
          <label style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-xs)',
            color: 'var(--pc-fg-3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Message</label>
          <textarea
            rows={5}
            placeholder="Tell us about your car and what you need…"
            className="pc-input"
            style={{ resize: 'none' }}
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: 'var(--pc-space-2)',
            padding: 'var(--pc-space-4) var(--pc-space-6)',
            borderRadius: 'var(--pc-radius-pill)',
            background: 'var(--pc-warm)',
            color: 'var(--pc-ink)',
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-sm)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            transition: 'background var(--pc-dur-fast) var(--pc-ease), transform var(--pc-dur-fast) var(--pc-ease)',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pc-warm-2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pc-warm)'; }}
        >
          Send Message →
        </button>
      </form>
    </Card>
  );
}
