'use client';
import { useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const SERVICES = [
  { id:'s1', name:'Interior Detailing',    category:'interior', priceMin:500,   priceMax:1000,  durationMin:90,  isPopular:true,  isActive:true,  description:'Deep vacuum, dashboard wipe, seat shampoo, and air vent cleaning.' },
  { id:'s2', name:'Exterior Wash',         category:'exterior', priceMin:200,   priceMax:500,   durationMin:45,  isPopular:true,  isActive:true,  description:'Foam pre-wash, hand wash, rinse, and blow-dry finish.' },
  { id:'s3', name:'Paint Protection Film', category:'paint',    priceMin:15000, priceMax:50000, durationMin:480, isPopular:false, isActive:true,  description:'Premium PPF application for lasting paint defence.' },
  { id:'s4', name:'Ceramic Coating',       category:'ceramic',  priceMin:8000,  priceMax:40000, durationMin:240, isPopular:true,  isActive:true,  description:'Long-lasting nano-ceramic protection for mirror-level gloss.' },
  { id:'s5', name:'Engine Bay Clean',      category:'exterior', priceMin:800,   priceMax:1500,  durationMin:60,  isPopular:false, isActive:false, description:'Degreased and detailed engine bay presentation clean.' },
  { id:'s6', name:'Headlight Restoration', category:'exterior', priceMin:600,   priceMax:1200,  durationMin:45,  isPopular:false, isActive:true,  description:'UV-degraded headlights polished and sealed for clarity.' },
];

// var(--pc-sage-lo) is not defined in the token file — use the raw rgba value
// that matches the pattern used elsewhere (e.g. worker skill chips).
const SAGE_LO = 'rgba(91, 111, 82, 0.18)';
const SAGE_BORDER = 'rgba(91, 111, 82, 0.4)';
const SAGE_TEXT = 'var(--pc-sage-hi)';

export default function ServicesMgmtPage() {
  const [selectedService, setSelectedService] = useState<any>(null);

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>[SERVICE CATALOGUE] · {SERVICES.length} SERVICES</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>
            Services & Pricing.
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Add Service
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['All', 'Exterior', 'Interior', 'Ceramic', 'Paint'].map((f, i) => (
          <span key={f} style={{
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: i === 0 ? 'var(--pc-warm)' : 'transparent',
            color: i === 0 ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
            border: i === 0 ? 'none' : '1px solid var(--pc-line)',
          }}>{f}</span>
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 110px 160px 100px 70px 110px 50px',
          padding: '10px 18px', borderBottom: '1px solid var(--pc-line)', gap: 12,
        }}>
          {['NAME', 'CATEGORY', 'PRICE RANGE', 'DURATION', 'POPULAR', 'STATUS', ''].map(h => (
            <div key={h} style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {SERVICES.map((s, i) => (
          <div key={s.id} style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 110px 160px 100px 70px 110px 50px',
            padding: '13px 18px', gap: 12, alignItems: 'center',
            borderBottom: i < SERVICES.length - 1 ? '1px solid var(--pc-line)' : 'none',
            opacity: s.isActive ? 1 : 0.6,
          }}>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff', fontWeight: 500 }}>{s.name}</span>
            {/* Category pill — uses inline rgba instead of undefined var(--pc-sage-lo) */}
            <span style={{
              display: 'inline-flex', alignSelf: 'center',
              padding: '3px 9px', borderRadius: 999,
              background: SAGE_LO, border: `1px solid ${SAGE_BORDER}`,
              fontFamily: 'var(--pc-mono)', fontSize: 9, color: SAGE_TEXT, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{s.category}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>₹{s.priceMin.toLocaleString('en-IN')} — ₹{s.priceMax.toLocaleString('en-IN')}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>{s.durationMin} min</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="star" size={15} color={s.isPopular ? 'var(--pc-gold)' : 'var(--pc-fg-4)'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: s.isActive ? '#6FAE6A' : 'var(--pc-fg-4)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: s.isActive ? 'var(--pc-fg-2)' : 'var(--pc-fg-3)' }}>
                {s.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <button
              onClick={() => setSelectedService(s)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="pencil" size={14} color="var(--pc-fg-3)" />
            </button>
          </div>
        ))}
      </Card>

      {/* Editor Drawer */}
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
                color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>DESCRIPTION</label>
              <textarea defaultValue={selectedService.description} rows={3} style={{
                background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, resize: 'none', outline: 'none',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>PRICE MIN (₹)</label>
                <input type="number" defaultValue={selectedService.priceMin} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>PRICE MAX (₹)</label>
                <input type="number" defaultValue={selectedService.priceMax} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>DURATION (MIN)</label>
              <input type="number" defaultValue={selectedService.durationMin} style={{
                background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={{ flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontWeight: 600, cursor: 'pointer' }}>
              Save Changes
            </button>
            <button onClick={() => setSelectedService(null)} style={{ flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
