'use client';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange()}
      style={{
        width: 44, height: 24, borderRadius: 999, cursor: 'pointer', flexShrink: 0,
        background: checked ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
        position: 'relative', transition: 'background 0.2s',
        border: `2px solid ${checked ? 'transparent' : 'var(--pc-line)'}`,
        outline: 'none',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: '#FFFFFF',
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsDoc {
  notifs:       { email: boolean; sms: boolean; push: boolean };
  integrations: { razorpay: boolean; googleCalendar: boolean; whatsapp: boolean };
  business:     { name: string; email: string; phone: string; gst: string };
}

const DEFAULTS: SettingsDoc = {
  notifs:       { email: true,  sms: true,  push: false },
  integrations: { razorpay: true, googleCalendar: false, whatsapp: true },
  business:     { name: 'Perfect Cleaners', email: 'ops@perfectcleaners.in', phone: '+91 98765 43210', gst: '' },
};

const SETTINGS_REF = () => doc(db, 'settings', 'operator');

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [notifs,       setNotifs]       = useState(DEFAULTS.notifs);
  const [integrations, setIntegrations] = useState(DEFAULTS.integrations);
  const [business,     setBusiness]     = useState(DEFAULTS.business);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Firestore on mount
  useEffect(() => {
    getDoc(SETTINGS_REF()).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data() as Partial<SettingsDoc>;
      if (d.notifs)       setNotifs(n => ({ ...n, ...d.notifs }));
      if (d.integrations) setIntegrations(i => ({ ...i, ...d.integrations }));
      if (d.business)     setBusiness(b => ({ ...b, ...d.business }));
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(SETTINGS_REF(), { notifs, integrations, business }, { merge: true });
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '10px 14px', boxSizing: 'border-box',
    background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8,
    fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', outline: 'none',
  };

  return (
    <div className="admin-page-root">

      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CONFIGURATION</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Settings</h1>
      </div>

      {/* Notifications */}
      <Card>
        <Eyebrow style={{ display: 'block', marginBottom: 20 }}>NOTIFICATION PREFERENCES</Eyebrow>
        {([
          { key: 'email', label: 'Email Notifications', description: 'Booking confirmations, reminders and receipts' },
          { key: 'sms',   label: 'SMS Notifications',   description: "Real-time job updates to customer's phone" },
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
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 700, color: 'var(--pc-fg-2)' }}>{item.label[0]}</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>{item.label}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{item.description}</p>
              </div>
            </div>
            <Toggle checked={integrations[item.key]} onChange={() => setIntegrations(i => ({ ...i, [item.key]: !i[item.key] }))} />
          </div>
        ))}
      </Card>

      {/* Business info */}
      <Card>
        <Eyebrow style={{ display: 'block', marginBottom: 20 }}>BUSINESS INFORMATION</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          {([
            { key: 'name',  label: 'Business Name'  },
            { key: 'email', label: 'Contact Email'  },
            { key: 'phone', label: 'Phone Number'   },
            { key: 'gst',   label: 'GST Number'     },
          ] as const).map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                value={business[f.key]}
                onChange={e => setBusiness(b => ({ ...b, [f.key]: e.target.value }))}
                style={INPUT}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 28px', borderRadius: 999,
              background: saved ? 'var(--pc-sage)' : 'var(--pc-warm)',
              border: 'none',
              fontFamily: 'var(--pc-sans)', fontWeight: 600, fontSize: 14,
              color: saved ? 'var(--pc-sage-ink)' : 'var(--pc-ink)',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background 0.2s, opacity 0.15s',
            }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
          {saved && (
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
              Settings updated.
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
