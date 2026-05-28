'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

const CUSTOMERS = [
  { id: 'C-001', name: 'Priya Sharma',   email: 'priya@email.com',   phone: '+91 98200 11111', jobs: 24, spent: '\u20b972,800', tier: 'Gold',     joined: 'Jan 2023' },
  { id: 'C-002', name: 'Arjun Mehta',    email: 'arjun@email.com',   phone: '+91 98200 22222', jobs: 18, spent: '\u20b952,200', tier: 'Silver',   joined: 'Mar 2023' },
  { id: 'C-003', name: 'Kavya Iyer',     email: 'kavya@email.com',   phone: '+91 98200 33333', jobs: 31, spent: '\u20b994,600', tier: 'Platinum', joined: 'Oct 2022' },
  { id: 'C-004', name: 'Ravi Gupta',     email: 'ravi@email.com',    phone: '+91 98200 44444', jobs: 9,  spent: '\u20b921,600', tier: 'Bronze',   joined: 'Aug 2024' },
  { id: 'C-005', name: 'Sneha Pillai',   email: 'sneha@email.com',   phone: '+91 98200 55555', jobs: 42, spent: '\u20b91,26,000',tier: 'Platinum', joined: 'Jun 2022' },
  { id: 'C-006', name: 'Vikram Nair',    email: 'vikram@email.com',  phone: '+91 98200 66666', jobs: 12, spent: '\u20b936,400', tier: 'Silver',   joined: 'Feb 2024' },
  { id: 'C-007', name: 'Ananya Reddy',   email: 'ananya@email.com',  phone: '+91 98200 77777', jobs: 6,  spent: '\u20b914,400', tier: 'Bronze',   joined: 'Nov 2024' },
  { id: 'C-008', name: 'Kiran Joshi',    email: 'kiran@email.com',   phone: '+91 98200 88888', jobs: 27, spent: '\u20b981,000', tier: 'Gold',     joined: 'Apr 2023' },
];

const TIER_COLORS: Record<string, string> = {
  Platinum: 'var(--pc-fg)',
  Gold:     'var(--pc-gold)',
  Silver:   'var(--pc-fg-3)',
  Bronze:   'var(--pc-warning)',
};

const KPIS = [
  { label: 'Total Customers', value: '1,284', icon: 'users' },
  { label: 'Active (30d)',    value: '847',   icon: 'user-check' },
  { label: 'New This Month',  value: '63',    icon: 'user-plus' },
  { label: 'Avg Lifetime',    value: '\u20b938,400', icon: 'trending-up' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CRM</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Customers</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)', borderRadius: 999,
            padding: '10px 18px', cursor: 'pointer',
            fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 500,
          }}>
            <Icon name="download" size={13} color="var(--pc-fg-2)" />
            Export CSV
          </button>
        </div>
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

      {/* Search + filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers\u2026"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {['All', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(t => (
            <button type="button" key={t} style={{
              padding: '7px 14px', borderRadius: 999,
              border: '1px solid var(--pc-line)',
              background: 'transparent', color: 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['Customer', 'Contact', 'Jobs', 'Total Spent', 'Tier', 'Joined'].map(h => (
                <th key={h} style={{
                  padding: '13px 18px', gap: 12, alignItems: 'center',
                  textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11,
                  color: 'var(--pc-fg-3)', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600, color: 'var(--pc-fg-2)' }}>{c.name[0]}</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{c.name}</p>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{c.id}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 18px' }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: '0 0 2px' }}>{c.email}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{c.phone}</p>
                </td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{c.jobs}</td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>{c.spent}</td>
                <td style={{ padding: '13px 18px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: TIER_COLORS[c.tier], flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: TIER_COLORS[c.tier] }}>{c.tier}</span>
                  </span>
                </td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
