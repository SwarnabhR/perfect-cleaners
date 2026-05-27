'use client';
import { useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const PROMOS = [
  { id:'p1', code:'MONSOON30', description:'30% off ceramic coating',    discountType:'percent', discountValue:30,  minOrderValue:4000, maxUses:500,  usedCount:127,  validFrom:'2026-05-27', validUntil:'2026-06-02', isActive:true  },
  { id:'p2', code:'SHINE10',   description:'10% off any wash',           discountType:'percent', discountValue:10,  minOrderValue:0,    maxUses:1000, usedCount:384,  validFrom:'2026-05-01', validUntil:'2026-05-31', isActive:true  },
  { id:'p3', code:'BUNDLE2',   description:'₹300 off when booking 2+',  discountType:'flat',    discountValue:300, minOrderValue:800,  maxUses:200,  usedCount:56,   validFrom:'2026-05-15', validUntil:'2026-06-15', isActive:true  },
  { id:'p4', code:'WELCOME50', description:'₹50 off first booking',      discountType:'flat',    discountValue:50,  minOrderValue:300,  maxUses:5000, usedCount:2341, validFrom:'2026-01-01', validUntil:'2026-12-31', isActive:false },
];

const STATS = [
  { label: 'ACTIVE CODES',      value: '3'       },
  { label: 'TOTAL REDEMPTIONS', value: '2,908'   },
  { label: 'EST. DISCOUNT GIVEN', value: '₹1,24,800' },
];

const COLS = ['CODE', 'DESCRIPTION', 'TYPE', 'VALUE', 'USES', 'VALID UNTIL', 'STATUS', 'ACTIONS'];

export default function PromotionsPage() {
  const [selectedPromo, setSelectedPromo] = useState<any>(null);

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>[PROMOTIONS] · {PROMOS.length} CODES</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>
            Promo Codes.
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          New Code
        </button>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {STATS.map(({ label, value }) => (
          <Card key={label} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Eyebrow>{label}</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 30, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 100px 80px 160px 110px 110px 80px',
          padding: '10px 18px', borderBottom: '1px solid var(--pc-line)', gap: 12,
        }}>
          {COLS.map(h => (
            <div key={h} style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {PROMOS.map((p, i) => (
          <div key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 100px 80px 160px 110px 110px 80px',
            padding: '13px 18px', gap: 12, alignItems: 'center',
            borderBottom: i < PROMOS.length - 1 ? '1px solid var(--pc-line)' : 'none',
            opacity: p.isActive ? 1 : 0.6,
          }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: '#fff', letterSpacing: '1.2px' }}>{p.code}</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{p.description}</span>
            <span style={{
              display: 'inline-flex', alignSelf: 'center',
              padding: '3px 8px', borderRadius: 6, background: 'var(--pc-card-hi)',
              fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{p.discountType === 'percent' ? 'PERCENT' : 'FLAT ₹'}</span>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 16, color: '#fff' }}>
              {p.discountType === 'percent' ? `${p.discountValue}%` : `₹${p.discountValue}`}
            </span>
            <div>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-2)', marginBottom: 5 }}>
                {p.usedCount.toLocaleString('en-IN')} / {p.maxUses.toLocaleString('en-IN')}
              </div>
              <div style={{ height: 4, background: 'var(--pc-line)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(p.usedCount / p.maxUses) * 100}%`, background: 'var(--pc-sage)' }} />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>
              {new Date(p.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: p.isActive ? '#6FAE6A' : 'var(--pc-fg-4)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: p.isActive ? '#6FAE6A' : 'var(--pc-fg-3)', letterSpacing: '0.06em' }}>
                {p.isActive ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => setSelectedPromo(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <Icon name="pencil" size={14} color="var(--pc-fg-2)" />
              </button>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <Icon name="archive" size={14} color="var(--pc-fg-3)" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      {/* Editor Drawer */}
      {selectedPromo && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
          background: 'var(--pc-card)', borderLeft: '1px solid var(--pc-line-strong)',
          zIndex: 50, padding: 32, display: 'flex', flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Eyebrow>EDIT PROMO CODE</Eyebrow>
            <button onClick={() => setSelectedPromo(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name="x" size={20} color="var(--pc-fg-2)" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>CODE</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" defaultValue={selectedPromo.code} style={{
                  flex: 1, background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: '#fff', fontFamily: 'var(--pc-mono)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '1.2px', outline: 'none',
                }} />
                <button style={{ padding: '0 16px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8, color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer' }}>Generate</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>DISCOUNT TYPE</label>
              <div style={{ display: 'flex', background: 'var(--pc-ink)', borderRadius: 8, padding: 4, border: '1px solid var(--pc-line)' }}>
                {['% Off', 'Flat ₹', 'BOGO'].map(type => (
                  <button key={type} style={{
                    flex: 1, padding: 8, borderRadius: 6, border: 'none',
                    background: selectedPromo.discountType === (type === '% Off' ? 'percent' : 'flat') ? 'var(--pc-card-hi)' : 'transparent',
                    color: selectedPromo.discountType === (type === '% Off' ? 'percent' : 'flat') ? '#fff' : 'var(--pc-fg-3)',
                    fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>{type}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>VALUE</label>
                <input type="number" defaultValue={selectedPromo.discountValue} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>MIN ORDER (₹)</label>
                <input type="number" defaultValue={selectedPromo.minOrderValue} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: '#fff', fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={{ flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontFamily: 'var(--pc-sans)', fontWeight: 600, cursor: 'pointer' }}>Publish</button>
            <button onClick={() => setSelectedPromo(null)} style={{ flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', cursor: 'pointer' }}>Save Draft</button>
          </div>
        </div>
      )}
    </div>
  );
}
