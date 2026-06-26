'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';

const SERVICES = [
  { value: 'society',    label: 'List My Society'             },
  { value: 'register',   label: 'Register as a Resident'      },
  { value: 'interior',   label: 'Interior Detailing (Add-on)' },
  { value: 'exterior',   label: 'Exterior Wash (Add-on)'      },
  { value: 'coating',    label: 'Paint Protection & Coating'  },
  { value: 'other',      label: 'Other / General Enquiry'     },
];

const label: React.CSSProperties = {
  fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600,
  color: 'var(--pc-fg-3)', letterSpacing: '0.05em',
  textTransform: 'uppercase', display: 'block', marginBottom: 8,
};

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '12px 14px',
  background: 'var(--pc-ink-raised)',
  border: '1px solid var(--pc-line-strong)',
  borderRadius: 'var(--pc-radius-sm)',
  color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
  transition: 'border-color 0.15s ease',
};

export default function ContactForm() {
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [email,   setEmail]   = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [busy,    setBusy]    = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Please fill in your name and message.');
      return;
    }
    setError(''); setBusy(true);
    try {
      await addDoc(collection(db, 'contactInquiries'), {
        name:      name.trim(),
        phone:     phone.trim(),
        email:     email.trim(),
        service,
        message:   message.trim(),
        createdAt: serverTimestamp(),
        status:    'new',
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card style={{ padding: 'var(--pc-space-8)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--pc-space-4)', padding: 'var(--pc-space-8) 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(74,94,68,0.12)', border: '1px solid var(--pc-sage-hi)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="var(--pc-sage-hi)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)', color: 'var(--pc-fg)', letterSpacing: '-0.02em', margin: 0 }}>
            Message received.
          </h3>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
            We'll get back to you within one business day. For urgent enquiries call{' '}
            <a href="tel:+9197711241629" style={{ color: 'var(--pc-fg)' }}>+91 97711241629</a>.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 'var(--pc-space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)',
        color: 'var(--pc-fg)', marginBottom: 'var(--pc-space-8)',
        letterSpacing: '-0.01em',
      }}>
        Send a Message
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

        <div className="pc-contact-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-4)' }}>
          <div>
            <label htmlFor="cf-name" style={label}>Full Name *</label>
            <input
              id="cf-name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name" required style={input}
            />
          </div>
          <div>
            <label htmlFor="cf-phone" style={label}>Phone</label>
            <input
              id="cf-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 97711241629" inputMode="tel" style={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cf-email" style={label}>Email</label>
          <input
            id="cf-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" style={input}
          />
        </div>

        <div>
          <label htmlFor="cf-service" style={label}>Enquiry Type</label>
          <select
            id="cf-service" value={service} onChange={e => setService(e.target.value)}
            style={{ ...input, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
          >
            <option value="">Select an enquiry type…</option>
            {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="cf-message" style={label}>Message *</label>
          <textarea
            id="cf-message" rows={5} value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Tell us about your society, or describe your service requirement…"
            required style={{ ...input, resize: 'none' }}
          />
        </div>

        {error && (
          <p role="alert" style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: 'var(--pc-space-2)',
            padding: 'var(--pc-space-4) var(--pc-space-6)',
            borderRadius: 'var(--pc-radius-pill)',
            background: busy ? 'var(--pc-warm-3)' : 'var(--pc-warm)',
            color: 'var(--pc-ink)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start',
            transition: 'background 0.15s ease',
          }}
        >
          {busy ? 'Sending…' : 'Send Message →'}
        </button>
      </form>
    </Card>
  );
}
