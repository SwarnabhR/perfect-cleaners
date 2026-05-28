'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

const WORKERS = [
  { id: 'W-01', name: 'Rajan Kumar',  role: 'Senior Cleaner',  status: 'Available', jobs: 48, rating: 4.97, revenue: '\u20b912,400', zone: 'North Bengaluru', skills: ['Deep Clean', 'Move-in/out', 'Office'] },
  { id: 'W-02', name: 'Sunita Devi',  role: 'Senior Cleaner',  status: 'On Job',    jobs: 42, rating: 4.94, revenue: '\u20b910,800', zone: 'South Bengaluru', skills: ['Regular', 'Deep Clean', 'Post-reno'] },
  { id: 'W-03', name: 'Mohan Rao',   role: 'Cleaner',          status: 'Available', jobs: 39, rating: 4.91, revenue: '\u20b99,750',  zone: 'East Bengaluru',  skills: ['Regular', 'Office'] },
  { id: 'W-04', name: 'Deepa Singh', role: 'Cleaner',          status: 'Off Today', jobs: 36, rating: 4.88, revenue: '\u20b99,100',  zone: 'West Bengaluru',  skills: ['Deep Clean', 'Carpet'] },
  { id: 'W-05', name: 'Ramesh G.',   role: 'Junior Cleaner',   status: 'On Job',    jobs: 22, rating: 4.80, revenue: '\u20b95,500',  zone: 'North Bengaluru', skills: ['Regular'] },
  { id: 'W-06', name: 'Lakshmi P.',  role: 'Junior Cleaner',   status: 'Available', jobs: 18, rating: 4.75, revenue: '\u20b94,500',  zone: 'Central',         skills: ['Regular', 'Deep Clean'] },
];


const KPIS = [
  { label: 'Total Workers', value: '18',  icon: 'users' },
  { label: 'On Duty Today', value: '14',  icon: 'user-check' },
  { label: 'Available Now', value: '6',   icon: 'circle-dot' },
  { label: 'Avg Rating',    value: '4.89',icon: 'star' },
];

export default function WorkersPage() {
  const [selectedWorker, setSelectedWorker] = useState<typeof WORKERS[0] | null>(null);

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>TEAM</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Workers</h1>
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Add Worker
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {KPIS.map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Worker cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {WORKERS.map(w => (
          <Card key={w.id} style={{ padding: 18, cursor: 'pointer' }} onClick={() => setSelectedWorker(w)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg-2)' }}>{w.name[0]}</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 600 }}>{w.name}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{w.role}</p>
                </div>
              </div>
              <StatusPill status={w.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 1px' }}>{w.jobs}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>JOBS</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 1px' }}>{w.rating}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>RATING</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 1px' }}>{w.revenue}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)', margin: 0 }}>REVENUE</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {w.skills.slice(0, 2).map(s => (
                <span key={s} style={{
                  padding: '3px 8px', borderRadius: 999,
                  background: 'var(--pc-sage-tint)', border: '1px solid var(--pc-sage-lo)',
                  fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-sage-hi)',
                }}>{s}</span>
              ))}
              {w.skills.length > 2 && (
                <span style={{
                  padding: '3px 8px', borderRadius: 999,
                  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
                  fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)',
                }}>+{w.skills.length - 2}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Worker detail panel */}
      {selectedWorker && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Eyebrow>WORKER DETAILS</Eyebrow>
            <button type="button" onClick={() => setSelectedWorker(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name="x" size={16} color="var(--pc-fg-2)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Full Name', value: selectedWorker.name },
              { label: 'Role',      value: selectedWorker.role },
              { label: 'Zone',      value: selectedWorker.zone },
              { label: 'Jobs',      value: String(selectedWorker.jobs) },
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
        </Card>
      )}
    </div>
  );
}
