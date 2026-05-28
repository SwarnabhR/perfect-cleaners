'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

const SERVICES = [
  { id: 'S-01', name: 'Regular Clean',   category: 'Recurring', price: '\u20b91,450', duration: '2.5 hrs', bookings: 680, rating: 4.88, active: true  },
  { id: 'S-02', name: 'Deep Clean',       category: 'One-time',  price: '\u20b93,200', duration: '5 hrs',   bookings: 412, rating: 4.92, active: true  },
  { id: 'S-03', name: 'Move-in/out',      category: 'One-time',  price: '\u20b94,800', duration: '6 hrs',   bookings: 198, rating: 4.95, active: true  },
  { id: 'S-04', name: 'Office Clean',     category: 'Commercial',price: '\u20b92,400', duration: '3 hrs',   bookings: 320, rating: 4.82, active: true  },
  { id: 'S-05', name: 'Post-reno Clean',  category: 'Specialty', price: '\u20b95,200', duration: '7 hrs',   bookings: 87,  rating: 4.90, active: true  },
  { id: 'S-06', name: 'Carpet Cleaning',  category: 'Add-on',    price: '\u20b9800',   duration: '1 hr',    bookings: 143, rating: 4.78, active: false },
];

export default function ServicesMgmtPage() {
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CATALOGUE</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Services</h1>
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Add Service
        </button>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['Service', 'Category', 'Price', 'Duration', 'Bookings', 'Rating', 'Active', ''].map(h => (
                <th key={h} style={{
                  padding: '13px 18px',
                  textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11,
                  color: 'var(--pc-fg-3)', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SERVICES.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{ padding: '14px 18px' }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{s.name}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{s.id}</p>
                </td>
                <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{s.category}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>{s.price}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{s.duration}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{s.bookings}</td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="star" size={12} color="var(--pc-warm)" />
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{s.rating}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500,
                    color: s.active ? 'var(--pc-sage)' : 'var(--pc-fg-3)',
                    background: 'var(--pc-card-hi)', padding: '3px 10px', borderRadius: 999,
                  }}>{s.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button type="button"
                      onClick={() => setSelectedService(s)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Icon name="pencil" size={14} color="var(--pc-fg-3)" />
                    </button>
                    <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
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
      {selectedService && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Eyebrow>EDIT SERVICE</Eyebrow>
            <button type="button" onClick={() => setSelectedService(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-2)' }}>
              <Icon name="x" size={16} color="var(--pc-fg-2)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Service Name', value: selectedService.name },
              { label: 'Price',        value: selectedService.price },
              { label: 'Duration',     value: selectedService.duration },
              { label: 'Category',     value: selectedService.category },
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
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" style={{ flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontWeight: 600, cursor: 'pointer' }}>
              Save Changes
            </button>
            <button type="button" onClick={() => setSelectedService(null)} style={{ flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: 'var(--pc-fg)', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
