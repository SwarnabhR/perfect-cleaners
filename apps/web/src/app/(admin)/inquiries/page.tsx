'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: { toDate(): Date } | Date | null;
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New', in_progress: 'In Progress', resolved: 'Resolved',
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  new:         { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)', color: 'var(--pc-warning)' },
  in_progress: { bg: 'color-mix(in srgb, var(--pc-info)    12%, transparent)', color: 'var(--pc-info)'    },
  resolved:    { bg: 'color-mix(in srgb, var(--pc-sage)    18%, transparent)', color: 'var(--pc-sage-hi)' },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: 'var(--pc-card-hi)', color: 'var(--pc-fg-3)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6,
      background: s.bg, fontFamily: 'var(--pc-mono)', fontSize: 10, fontWeight: 600,
      color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function fmtDate(ts: Inquiry['createdAt']): string {
  if (!ts) return '—';
  const d = typeof (ts as { toDate?(): Date }).toDate === 'function'
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as Date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'contactInquiries'), orderBy('createdAt', 'desc')),
      snap => { setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry))); setLoading(false); },
      err  => { console.warn('[Inquiries]', err.message); setLoading(false); },
    );
  }, []);

  async function setStatus(id: string, status: Inquiry['status']) {
    if (updating) return;
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'contactInquiries', id), { status, updatedAt: serverTimestamp() });
    } finally { setUpdating(null); }
  }

  const todayMs = new Date().setHours(0, 0, 0, 0);
  const newCount      = inquiries.filter(i => i.status === 'new').length;
  const todayCount    = inquiries.filter(i => {
    const ts = i.createdAt;
    if (!ts) return false;
    const d = typeof (ts as { toDate?(): Date }).toDate === 'function'
      ? (ts as { toDate(): Date }).toDate()
      : new Date(ts as Date);
    return d.getTime() >= todayMs;
  }).length;
  const resolvedCount = inquiries.filter(i => i.status === 'resolved').length;

  const kpis = [
    { label: 'Total',    value: inquiries.length, icon: 'mail',       color: 'var(--pc-info)'    },
    { label: 'New',      value: newCount,          icon: 'bell',       color: 'var(--pc-warning)' },
    { label: 'Today',    value: todayCount,         icon: 'calendar',   color: 'var(--pc-sage)'    },
    { label: 'Resolved', value: resolvedCount,      icon: 'check',      color: 'var(--pc-fg-3)'    },
  ];

  const filtered = inquiries.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q)    ||
      i.phone.toLowerCase().includes(q)   ||
      i.email.toLowerCase().includes(q)   ||
      i.message.toLowerCase().includes(q) ||
      i.service.toLowerCase().includes(q)
    );
  });

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11,
    color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '13px 16px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
    verticalAlign: 'top',
  };

  return (
    <div className="admin-page-root">
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>SUPPORT</Eyebrow>
        <h1 className="admin-page-title">Contact Inquiries</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
          Messages submitted via the website contact form
        </p>
      </div>

      <div className="kpi-grid-4">
        {kpis.map(({ label, value, icon, color }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color={color} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                {loading ? '—' : value}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, message…"
            className="admin-search-input"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              boxSizing: 'border-box', background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
              borderRadius: 999, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div className="filter-chips">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map(s => (
            <button key={s} type="button" onClick={() => setFilter(s)} style={{
              padding: '6px 13px', borderRadius: 999, border: '1px solid',
              borderColor: filter === s ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  filter === s ? 'var(--pc-sage)' : 'transparent',
              color:       filter === s ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
            }}>
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No inquiries found</p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              {search || filter !== 'all' ? 'Try adjusting your filters.' : 'Contact form submissions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Date', 'Contact', 'Service', 'Message', 'Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inquiry, idx) => (
                  <>
                    <tr
                      key={inquiry.id}
                      className="pc-table-row"
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none', cursor: 'pointer' }}
                      onClick={() => setExpanded(e => e === inquiry.id ? null : inquiry.id)}
                    >
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>
                        {fmtDate(inquiry.createdAt)}
                      </td>
                      <td style={tdStyle}>
                        <p style={{ margin: 0, fontWeight: 500, color: 'var(--pc-fg)' }}>{inquiry.name}</p>
                        {inquiry.phone && <p style={{ margin: '2px 0 0', fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>{inquiry.phone}</p>}
                        {inquiry.email && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--pc-fg-4)' }}>{inquiry.email}</p>}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{inquiry.service || '—'}</td>
                      <td style={{ ...tdStyle, maxWidth: 280 }}>
                        <p style={{ margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {inquiry.message}
                        </p>
                      </td>
                      <td style={{ ...tdStyle, padding: '10px 16px' }}>
                        <StatusChip status={inquiry.status} />
                      </td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {inquiry.status !== 'in_progress' && (
                            <button type="button" disabled={updating === inquiry.id} onClick={e => { e.stopPropagation(); setStatus(inquiry.id, 'in_progress'); }}
                              style={{ padding: '4px 9px', borderRadius: 6, background: 'transparent', border: '1px solid var(--pc-info)', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-info)', cursor: 'pointer', opacity: updating === inquiry.id ? 0.5 : 1 }}>
                              In Progress
                            </button>
                          )}
                          {inquiry.status !== 'resolved' && (
                            <button type="button" disabled={updating === inquiry.id} onClick={e => { e.stopPropagation(); setStatus(inquiry.id, 'resolved'); }}
                              style={{ padding: '4px 9px', borderRadius: 6, background: 'transparent', border: '1px solid var(--pc-sage)', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-sage-hi)', cursor: 'pointer', opacity: updating === inquiry.id ? 0.5 : 1 }}>
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === inquiry.id && (
                      <tr key={`${inquiry.id}-exp`} style={{ background: 'var(--pc-card-hi)' }}>
                        <td colSpan={6} style={{ padding: '14px 20px' }}>
                          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>FULL MESSAGE</p>
                          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{inquiry.message}</p>
                          {inquiry.email && (
                            <a href={`mailto:${inquiry.email}?subject=Re: Your enquiry to Perfect Cleaners`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '7px 14px', borderRadius: 8, background: 'var(--pc-card)', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', textDecoration: 'none' }}>
                              <Icon name="mail" size={13} color="var(--pc-fg-3)" /> Reply by email
                            </a>
                          )}
                          {inquiry.phone && (
                            <a href={`tel:${inquiry.phone}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, marginLeft: 8, padding: '7px 14px', borderRadius: 8, background: 'var(--pc-card)', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', textDecoration: 'none' }}>
                              <Icon name="phone" size={13} color="var(--pc-fg-3)" /> Call {inquiry.phone}
                            </a>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
