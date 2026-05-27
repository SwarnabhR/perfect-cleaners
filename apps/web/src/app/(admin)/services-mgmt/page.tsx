'use client';
import { useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const SERVICES = [
  { id:'s1', name:'Interior Detailing', category:'interior', priceMin:500, priceMax:1000, durationMin:90, isPopular:true, isActive:true, description:'Deep vacuum, dashboard wipe, seat shampoo, and air vent cleaning.' },
  { id:'s2', name:'Exterior Wash', category:'exterior', priceMin:200, priceMax:500, durationMin:45, isPopular:true, isActive:true, description:'Foam pre-wash, hand wash, rinse, and blow-dry finish.' },
  { id:'s3', name:'Paint Protection Film', category:'paint', priceMin:15000, priceMax:50000, durationMin:480, isPopular:false, isActive:true, description:'Premium PPF application for lasting paint defence.' },
  { id:'s4', name:'Ceramic Coating', category:'ceramic', priceMin:8000, priceMax:40000, durationMin:240, isPopular:true, isActive:true, description:'Long-lasting nano-ceramic protection for mirror-level gloss.' },
  { id:'s5', name:'Engine Bay Clean', category:'exterior', priceMin:800, priceMax:1500, durationMin:60, isPopular:false, isActive:false, description:'Degreased and detailed engine bay presentation clean.' },
  { id:'s6', name:'Headlight Restoration', category:'exterior', priceMin:600, priceMax:1200, durationMin:45, isPopular:false, isActive:true, description:'UV-degraded headlights polished and sealed for clarity.' },
];

export default function ServicesMgmtPage() {
  const [selectedService, setSelectedService] = useState<any>(null);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Eyebrow>[SERVICE CATALOGUE]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', margin: '8px 0 0' }}>
            Services & Pricing
          </h1>
        </div>
        <button style={{
          padding: '10px 18px', borderRadius: 999,
          background: 'var(--pc-warm)', color: 'var(--pc-ink)',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
        }}>+ Add Service</button>
      </header>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['All', 'Exterior', 'Interior', 'Detailing', 'Ceramic', 'Paint'].map(f => (
          <button key={f} style={{
            padding: '6px 14px', borderRadius: 999,
            background: f === 'All' ? 'var(--pc-card-hi)' : 'transparent',
            border: `1px solid ${f === 'All' ? 'var(--pc-line)' : 'transparent'}`,
            color: f === 'All' ? 'var(--pc-fg)' : 'var(--pc-fg-2)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['NAME', 'CATEGORY', 'PRICE RANGE', 'DURATION', 'POPULAR', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{
                  padding: '16px 20px', fontFamily: 'var(--pc-mono)', fontSize: 10,
                  color: 'var(--pc-fg-3)', letterSpacing: '0.06em', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SERVICES.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>
                  {s.name}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: 6, background: 'var(--pc-sage-lo)',
                    color: 'var(--pc-sage)', fontFamily: 'var(--pc-mono)', fontSize: 10, textTransform: 'uppercase'
                  }}>{s.category}</span>
                </td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>
                  ₹{s.priceMin} — ₹{s.priceMax}
                </td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)' }}>
                  {s.durationMin} min
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <Icon name="star" size={16} color={s.isPopular ? 'var(--pc-gold)' : 'var(--pc-fg-4)'} />
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <button style={{
                    padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: s.isActive ? 'var(--pc-sage)' : 'var(--pc-card)',
                    color: s.isActive ? 'var(--pc-ink)' : 'var(--pc-fg-3)',
                    fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 600,
                  }}>
                    {s.isActive ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <button onClick={() => setSelectedService(s)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--pc-fg-2)',
                  }}>
                    <Icon name="pencil" size={16} color="currentColor" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Editor Drawer (simplified) */}
      {selectedService && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
          background: 'var(--pc-card)', borderLeft: '1px solid var(--pc-line-strong)',
          zIndex: 50, padding: 32, display: 'flex', flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Eyebrow>EDIT SERVICE</Eyebrow>
            <button onClick={() => setSelectedService(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-2)' }}>
              <Icon name="x" size={20} color="currentColor" />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>NAME</label>
              <input type="text" defaultValue={selectedService.name} style={{
                background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14,
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>DESCRIPTION</label>
              <textarea defaultValue={selectedService.description} rows={3} style={{
                background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14, resize: 'none'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>PRICE MIN (₹)</label>
                <input type="number" defaultValue={selectedService.priceMin} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>PRICE MAX (₹)</label>
                <input type="number" defaultValue={selectedService.priceMax} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14,
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={{ flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Save Changes
            </button>
            <button onClick={() => setSelectedService(null)} style={{ flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: 'var(--pc-fg)', border: '1px solid var(--pc-line)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
