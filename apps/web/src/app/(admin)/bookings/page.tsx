'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

const BOOKINGS = [
  { id: '#B-1048', customer: 'Priya Sharma',   service: 'Deep Clean',    date: 'Today, 09:00',   status: 'In Progress', worker: 'Rajan K.',  amount: '\u20b93,200' },
  { id: '#B-1049', customer: 'Arjun Mehta',    service: 'Regular',       date: 'Today, 10:30',   status: 'Confirmed',   worker: 'Sunita D.', amount: '\u20b91,450' },
  { id: '#B-1050', customer: 'Kavya Iyer',     service: 'Move-in Clean', date: 'Today, 12:00',   status: 'Confirmed',   worker: 'Mohan R.',  amount: '\u20b94,800' },
  { id: '#B-1051', customer: 'Ravi Gupta',     service: 'Office Clean',  date: 'Today, 14:00',   status: 'Pending',     worker: 'Unassigned',amount: '\u20b92,400' },
  { id: '#B-1052', customer: 'Sneha Pillai',   service: 'Post-reno',     date: 'Today, 15:30',   status: 'Confirmed',   worker: 'Deepa S.',  amount: '\u20b95,200' },
  { id: '#B-1053', customer: 'Vikram Nair',    service: 'Deep Clean',    date: 'Tomorrow, 09:00',status: 'Confirmed',   worker: 'Rajan K.',  amount: '\u20b93,200' },
  { id: '#B-1054', customer: 'Ananya Reddy',   service: 'Regular',       date: 'Tomorrow, 11:00',status: 'Confirmed',   worker: 'Sunita D.', amount: '\u20b91,450' },
  { id: '#B-1055', customer: 'Kiran Joshi',    service: 'One-time',      date: 'Tomorrow, 14:00',status: 'Pending',     worker: 'Unassigned',amount: '\u20b92,100' },
];


const KPIS = [
  { label: 'Today',     value: '12', icon: 'calendar' },
  { label: 'Tomorrow',  value: '9',  icon: 'calendar-clock' },
  { label: 'Pending',   value: '4',  icon: 'clock' },
  { label: 'This Week', value: '47', icon: 'calendar-range' },
];

export default function BookingsPage() {
  const [filter, setFilter] = useState('All');

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>SCHEDULE</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Bookings</h1>
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          New Booking
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

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['All', 'Today', 'Tomorrow', 'This Week', 'Pending'].map(f => (
          <button type="button" key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, border: '1px solid',
            borderColor: filter === f ? 'var(--pc-sage)' : 'var(--pc-line)',
            background: filter === f ? 'var(--pc-sage)' : 'transparent',
            color: filter === f ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
            padding: '8px 16px', cursor: 'pointer',
            fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
          }}>
            <Icon name="download" size={13} color="var(--pc-fg-2)" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['Booking ID', 'Customer', 'Service', 'Date & Time', 'Worker', 'Amount', 'Status'].map(h => (
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
            {BOOKINGS.map(b => (
              <tr key={b.id} className="pc-table-row" style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)' }}>{b.id}</td>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 600, color: 'var(--pc-fg-2)' }}>{b.customer[0]}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{b.customer}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{b.service}</td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{b.date}</td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{b.worker}</td>
                <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>{b.amount}</td>
                <td style={{ padding: '13px 18px' }}><StatusPill status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
