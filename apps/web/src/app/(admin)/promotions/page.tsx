'use client';
import { useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const PROMOS = [
  { id:'p1', code:'MONSOON30', description:'30% off ceramic coating', discountType:'percent', discountValue:30, minOrderValue:4000, maxUses:500, usedCount:127, validFrom:'2026-05-27', validUntil:'2026-06-02', isActive:true },
  { id:'p2', code:'SHINE10', description:'10% off any wash', discountType:'percent', discountValue:10, minOrderValue:0, maxUses:1000, usedCount:384, validFrom:'2026-05-01', validUntil:'2026-05-31', isActive:true },
  { id:'p3', code:'BUNDLE2', description:'₹300 off when booking 2+', discountType:'flat', discountValue:300, minOrderValue:800, maxUses:200, usedCount:56, validFrom:'2026-05-15', validUntil:'2026-06-15', isActive:true },
  { id:'p4', code:'WELCOME50', description:'₹50 off first booking', discountType:'flat', discountValue:50, minOrderValue:300, maxUses:5000, usedCount:2341, validFrom:'2026-01-01', validUntil:'2026-12-31', isActive:false },
];

export default function PromotionsPage() {
  const [selectedPromo, setSelectedPromo] = useState<any>(null);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Eyebrow>[PROMOTIONS]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', margin: '8px 0 0' }}>
            Promo Codes
          </h1>
        </div>
        <button style={{
          padding: '10px 18px', borderRadius: 999,
          background: 'var(--pc-warm)', color: 'var(--pc-ink)',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
        }}>+ New Code</button>
      </header>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <Card>
          <Eyebrow>Active Codes</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>3</div>
        </Card>
        <Card>
          <Eyebrow>Total Redemptions</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>2,908</div>
        </Card>
        <Card>
          <Eyebrow>Est. Discount Given</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>₹1,24,800</div>
        </Card>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['CODE', 'DESCRIPTION', 'TYPE', 'VALUE', 'USES', 'VALID UNTIL', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{
                  padding: '16px 20px', fontFamily: 'var(--pc-mono)', fontSize: 10,
                  color: 'var(--pc-fg-3)', letterSpacing: '0.06em', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROMOS.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg)', letterSpacing: '1.2px' }}>
                  {p.code}
                </td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                  {p.description}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: 6, background: 'var(--pc-card-hi)',
                    color: 'var(--pc-fg)', fontFamily: 'var(--pc-mono)', fontSize: 10, textTransform: 'uppercase'
                  }}>{p.discountType === 'percent' ? 'PERCENT' : 'FLAT ₹'}</span>
                </td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-serif)', fontSize: 16, color: 'var(--pc-fg)' }}>
                  {p.discountType === 'percent' ? `${p.discountValue}%` : `₹${p.discountValue}`}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)', marginBottom: 4 }}>
                    {p.usedCount} / {p.maxUses}
                  </div>
                  <div style={{ height: 4, width: '100%', background: 'var(--pc-line)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.usedCount/p.maxUses)*100}%`, background: 'var(--pc-sage)' }} />
                  </div>
                </td>
                <td style={{ padding: '16px 20px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                  {new Date(p.validUntil).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </td>
                <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.isActive ? (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pc-sage)' }} />
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-sage)' }}>ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pc-fg-4)' }} />
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>PAUSED</span>
                    </>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setSelectedPromo(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-2)' }}>
                      <Icon name="pencil" size={16} color="currentColor" />
                    </button>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-3)' }}>
                      <Icon name="archive" size={16} color="currentColor" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Editor Drawer (simplified) */}
      {selectedPromo && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
          background: 'var(--pc-card)', borderLeft: '1px solid var(--pc-line-strong)',
          zIndex: 50, padding: 32, display: 'flex', flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Eyebrow>EDIT PROMO CODE</Eyebrow>
            <button onClick={() => setSelectedPromo(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-2)' }}>
              <Icon name="x" size={20} color="currentColor" />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>CODE</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" defaultValue={selectedPromo.code} style={{
                  flex: 1, background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: 'var(--pc-fg)', fontFamily: 'var(--pc-mono)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '1.2px'
                }} />
                <button style={{ padding: '0 16px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8, color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer' }}>Generate</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>DISCOUNT TYPE</label>
              <div style={{ display: 'flex', background: 'var(--pc-ink)', borderRadius: 8, padding: 4, border: '1px solid var(--pc-line)' }}>
                {['% Off', 'Flat ₹', 'BOGO'].map(type => (
                  <button key={type} style={{
                    flex: 1, padding: 8, borderRadius: 6, border: 'none',
                    background: selectedPromo.discountType === (type === '% Off' ? 'percent' : 'flat') ? 'var(--pc-card-hi)' : 'transparent',
                    color: selectedPromo.discountType === (type === '% Off' ? 'percent' : 'flat') ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
                    fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500, cursor: 'pointer'
                  }}>{type}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>VALUE</label>
                <input type="number" defaultValue={selectedPromo.discountValue} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)' }}>MIN ORDER (₹)</label>
                <input type="number" defaultValue={selectedPromo.minOrderValue} style={{
                  background: 'var(--pc-ink)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12,
                  color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14,
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={{ flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Publish
            </button>
            <button onClick={() => setSelectedPromo(null)} style={{ flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: 'var(--pc-fg)', border: '1px solid var(--pc-line)', cursor: 'pointer' }}>
              Save Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
