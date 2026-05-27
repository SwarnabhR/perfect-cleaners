'use client';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

function SettingRow({ label, control }: { label: React.ReactNode, control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--pc-line)' }}>
      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{label}</div>
      <div>{control}</div>
    </div>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 44, height: 24, borderRadius: 12,
      background: checked ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
      border: `2px solid ${checked ? 'transparent' : 'var(--pc-line)'}`
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        position: 'absolute', top: 0, left: checked ? 20 : 0, transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
}

function TextInput({ value, masked = false }: { value: string, masked?: boolean }) {
  return (
    <input type={masked ? 'password' : 'text'} defaultValue={value} style={{
      background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)', borderRadius: 8, padding: '8px 12px',
      color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 13, width: 240,
    }} />
  );
}

export default function SettingsPage() {
  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <Eyebrow>[SETTINGS]</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', margin: '8px 0 0' }}>
          Operator Settings
        </h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Business Info */}
        <section>
          <Eyebrow style={{ marginBottom: 12, display: 'block' }}>BUSINESS INFO</Eyebrow>
          <Card style={{ padding: 0 }}>
            <SettingRow label="Business Name" control={<TextInput value="Perfect Cleaners" />} />
            <SettingRow label="Address" control={<TextInput value="B-204 Industrial Area, Kavi Nagar" />} />
            <SettingRow label="Phone" control={<TextInput value="+91 98765 43210" />} />
            <SettingRow label="Email" control={<TextInput value="hello@perfectcleaners.in" />} />
            <SettingRow label="Operating Hours" control={<TextInput value="Mon-Sun 09:00-21:00" />} />
          </Card>
        </section>

        {/* Notifications */}
        <section>
          <Eyebrow style={{ marginBottom: 12, display: 'block' }}>NOTIFICATION PREFERENCES</Eyebrow>
          <Card style={{ padding: 0 }}>
            <SettingRow label={<div>New booking received<div style={{ fontSize: 12, color: 'var(--pc-fg-3)', marginTop: 2 }}>Email and push notification</div></div>} control={<Toggle checked={true} />} />
            <SettingRow label="Worker assigned" control={<Toggle checked={true} />} />
            <SettingRow label="Payment received" control={<Toggle checked={false} />} />
            <SettingRow label="Booking cancellation" control={<Toggle checked={true} />} />
          </Card>
        </section>

        {/* Integrations */}
        <section>
          <Eyebrow style={{ marginBottom: 12, display: 'block' }}>INTEGRATIONS</Eyebrow>
          <Card style={{ padding: 0 }}>
            <SettingRow label="Razorpay Webhook URL" control={
              <div style={{ display: 'flex', gap: 8 }}>
                <TextInput value="https://api.perfectcleaners.in/webhooks/razorpay" />
                <button style={{ padding: '0 12px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8, color: 'var(--pc-fg)', cursor: 'pointer' }}>Test</button>
              </div>
            } />
            <SettingRow label="FCM Server Key" control={<TextInput value="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" masked />} />
            <SettingRow label="Google Maps API Key" control={<TextInput value="AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" masked />} />
          </Card>
        </section>

        {/* Danger Zone */}
        <section>
          <Eyebrow style={{ marginBottom: 12, display: 'block' }}>DANGER ZONE</Eyebrow>
          <Card style={{ padding: 20, border: '1px solid var(--pc-danger)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>Clear all demo data</div>
                <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', marginTop: 4 }}>This will permanently remove all bookings, customers, and payments.</div>
              </div>
              <button style={{
                padding: '8px 16px', borderRadius: 8, background: 'transparent',
                border: '1px solid var(--pc-danger)', color: 'var(--pc-danger)',
                fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}>Clear Data</button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
