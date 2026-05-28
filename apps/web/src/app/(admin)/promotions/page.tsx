'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

const PROMOS = [
  { id: 'P-01', code: 'CLEAN20',    discount: '20% off',  uses: 142, limit: 200, expires: '30 Jun 2026', status: 'Active',   type: 'Percentage' },
  { id: 'P-02', code: 'FIRSTFREE',  discount: '\u20b9500 off', uses: 88,  limit: 100, expires: '15 Jul 2026', status: 'Active',   type: 'Flat' },
  { id: 'P-03', code: 'SUMMER25',   discount: '25% off',  uses: 200, limit: 200, expires: '01 Jun 2026', status: 'Expired',  type: 'Percentage' },
  { id: 'P-04', code: 'REFER100',   discount: '\u20b9100 off', uses: 54,  limit: null, expires: 'No expiry',   status: 'Active',   type: 'Referral' },
  { id: 'P-05', code: 'DEEPCLEAN',  discount: '15% off',  uses: 0,   limit: 50,  expires: '31 Aug 2026', status: 'Scheduled',type: 'Percentage' },
];

const STATUS_COLORS: Record<string, string> = {
  Active:    'var(--pc-sage)',
  Expired:   'var(--pc-rust)',
  Scheduled: 'var(--pc-warm)',
  Paused:    'var(--pc-fg-3)',
};

const KPIS = [
  { label: 'Active Promos',   value: '3',        icon: 'tag' },
  { label: 'Total Uses',      value: '484',      icon: 'bar-chart-2' },
  { label: 'Revenue Impact',  value: '\u20b938,200',   icon: 'trending-down' },
  { label: 'Avg Discount',    value: '\u20b91,840',    icon: 'percent' },
];

export default function PromotionsPage() {
  const [selectedPromo, setSelectedPromo] = useState<typeof PROMOS[0] | null>(null);

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>MARKETING</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Promotions</h1>
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Create Promo
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {KPIS.map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
              <Icon name={icon} size={14} color="var(--pc-fg-4)" />
            </div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 24, color: 'var(--pc-fg)', margin: 0 }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Promos table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>ALL PROMOTIONS</Eyebrow>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['Code', 'Discount', 'Type', 'Uses', 'Expires', 'Status', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '13px 18px', gap: 12, alignItems: 'center',
                  textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11,
                  color: 'var(--pc-fg-3)', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROMOS.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{ padding: '13px 18px' }}>
                  <span style={{ fontFamily: 'var(--pc-mono, monospace)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 600, background: 'var(--pc-card-hi)', padding: '2px 8px', borderRadius: 4 }}>{p.code}</span>
                </td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>{p.discount}</td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{p.type}</td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                  {p.uses}{p.limit ? `/${p.limit}` : ''}
                </td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>{p.expires}</td>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_COLORS[p.status], flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: STATUS_COLORS[p.status] }}>{p.status}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button type="button" onClick={() => setSelectedPromo(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <Icon name="pencil" size={14} color="var(--pc-fg-3)" />
                    </button>
                    <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <Icon name="trash-2" size={14} color="var(--pc-rust)" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit panel */}
      {selectedPromo && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Eyebrow>EDIT PROMOTION</Eyebrow>
            <button type="button" onClick={() => setSelectedPromo(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-2)' }}>
              <Icon name="x" size={16} color="var(--pc-fg-2)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[{ label: 'Promo Code', value: selectedPromo.code }, { label: 'Discount', value: selectedPromo.discount }].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    defaultValue={f.value}
                    style={{
                      flex: 1, padding: '10px 14px',
                      background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8,
                      fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', outline: 'none',
                    }}
                  />
                  <button type="button" style={{ padding: '0 16px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8, color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer' }}>Generate</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Promo Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Percentage', 'Flat', 'Referral'].map(type => (
                <button type="button" key={type} style={{
                  padding: '8px 18px', borderRadius: 999, border: '1px solid',
                  borderColor: selectedPromo.type === type ? 'var(--pc-sage)' : 'var(--pc-line)',
                  background: selectedPromo.type === type ? 'var(--pc-sage)' : 'transparent',
                  color: selectedPromo.type === type ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
                }}>{type}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" style={{ flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontWeight: 600, cursor: 'pointer' }}>Publish</button>
            <button type="button" onClick={() => setSelectedPromo(null)} style={{ flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: 'var(--pc-fg)', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', cursor: 'pointer' }}>Save Draft</button>
          </div>
        </Card>
      )}
    </div>
  );
}
