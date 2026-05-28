'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 999, cursor: 'pointer',
        background: checked ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        border: `2px solid ${checked ? 'transparent' : 'var(--pc-line)'}`
      }}>
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: 'var(--pc-fg-inv)',
        position: 'absolute', top: 0, left: checked ? 20 : 0, transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: false });
  const [integrations, setIntegrations] = useState({ razorpay: true, googleCalendar: false, whatsapp: true });

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CONFIGURATION</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Settings</h1>
      </div>

      {/* Notifications */}
      <Card>
        <Eyebrow style={{ display: 'block', marginBottom: 20 }}>NOTIFICATION PREFERENCES</Eyebrow>
        {([
          { key: 'email', label: 'Email Notifications', description: 'Booking confirmations, reminders and receipts' },
          { key: 'sms',   label: 'SMS Notifications',   description: 'Real-time job updates to customer\'s phone' },
          { key: 'push',  label: 'Push Notifications',  description: 'In-app alerts for the operations team' },
        ] as const).map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: 14, borderBottom: '1px solid var(--pc-line)' }}>
            <div>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>{item.label}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{item.description}</p>
            </div>
            <Toggle checked={notifs[item.key]} onChange={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))} />
          </div>
        ))}
      </Card>

      {/* Integrations */}
      <Card>
        <Eyebrow style={{ display: 'block', marginBottom: 20 }}>INTEGRATIONS</Eyebrow>
        {([
          { key: 'razorpay',       label: 'Razorpay',        description: 'Payment gateway for online bookings' },
          { key: 'googleCalendar', label: 'Google Calendar', description: 'Sync worker schedules automatically' },
          { key: 'whatsapp',       label: 'WhatsApp',         description: 'Send booking updates via WhatsApp' },
        ] as const).map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: 14, borderBottom: '1px solid var(--pc-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 700, color: 'var(--pc-fg-2)' }}>{item.label[0]}</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>{item.label}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{item.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" style={{ padding: '0 12px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8, color: 'var(--pc-fg)', cursor: 'pointer', fontFamily: 'var(--pc-sans)', fontSize: 12, height: 32 }}>Test</button>
              <Toggle checked={integrations[item.key]} onChange={() => setIntegrations(i => ({ ...i, [item.key]: !i[item.key] }))} />
            </div>
          </div>
        ))}
      </Card>

      {/* Business info */}
      <Card>
        <Eyebrow style={{ display: 'block', marginBottom: 20 }}>BUSINESS INFORMATION</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Business Name',  value: 'Perfect Cleaners' },
            { label: 'Contact Email',  value: 'ops@perfectcleaners.in' },
            { label: 'Phone Number',   value: '+91 98200 00000' },
            { label: 'GST Number',     value: '27AABCP1234C1Z5' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</label>
              <input
                defaultValue={f.value}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8,
                  fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
        <button type="button" style={{
          padding: '10px 28px', borderRadius: 999,
          background: 'var(--pc-warm)', border: 'none',
          fontFamily: 'var(--pc-sans)', fontWeight: 600, fontSize: 14,
          color: 'var(--pc-ink)', cursor: 'pointer',
        }}>Save Changes</button>
      </Card>
    </div>
  );
}
