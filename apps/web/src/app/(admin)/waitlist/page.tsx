'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface WaitlistEntry {
  id: string;
  phone: string;
  platform: 'android' | 'ios' | 'both';
  createdAt: { toDate(): Date } | Date | null;
}

const PLATFORM_LABEL: Record<string, string> = { android: 'Android', ios: 'iOS', both: 'Both' };
const PLATFORM_COLOR: Record<string, string> = {
  android: 'var(--pc-sage-hi)',
  ios:     'var(--pc-info)',
  both:    'var(--pc-fg-2)',
};

function fmtDate(ts: WaitlistEntry['createdAt']): string {
  if (!ts) return '—';
  const d = typeof (ts as { toDate?(): Date }).toDate === 'function'
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as Date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'android' | 'ios' | 'both'>('all');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'appWaitlist'), orderBy('createdAt', 'desc')),
      snap => { setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as WaitlistEntry))); setLoading(false); },
      err  => { console.warn('[Waitlist]', err.message); setLoading(false); },
    );
  }, []);

  const todayMs = new Date().setHours(0, 0, 0, 0);
  const androidCount = entries.filter(e => e.platform === 'android').length;
  const iosCount     = entries.filter(e => e.platform === 'ios').length;
  const bothCount    = entries.filter(e => e.platform === 'both').length;
  const todayCount   = entries.filter(e => {
    const ts = e.createdAt;
    if (!ts) return false;
    const d = typeof (ts as { toDate?(): Date }).toDate === 'function'
      ? (ts as { toDate(): Date }).toDate() : new Date(ts as Date);
    return d.getTime() >= todayMs;
  }).length;

  const kpis = [
    { label: 'Total Signups', value: entries.length, icon: 'smartphone', color: 'var(--pc-info)'    },
    { label: 'Android',       value: androidCount,   icon: 'cpu',        color: 'var(--pc-sage-hi)' },
    { label: 'iOS',           value: iosCount,       icon: 'apple',      color: 'var(--pc-fg-2)'    },
    { label: 'Today',         value: todayCount,     icon: 'sun',        color: 'var(--pc-warning)'  },
  ];

  const filtered = entries.filter(e => {
    if (filter !== 'all' && e.platform !== filter) return false;
    if (!search) return true;
    return e.phone.includes(search);
  });

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11,
    color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
  };
  const tdStyle: React.CSSProperties = {
    padding: '13px 16px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
  };

  return (
    <div className="admin-page-root">
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>GROWTH</Eyebrow>
        <h1 className="admin-page-title">App Waitlist</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
          Customers who signed up for early access to the Perfect Cleaners app
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
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by phone number…"
            className="admin-search-input"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              boxSizing: 'border-box', background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
              borderRadius: 999, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div className="filter-chips">
          {(['all', 'android', 'ios', 'both'] as const).map(p => (
            <button key={p} type="button" onClick={() => setFilter(p)} style={{
              padding: '6px 13px', borderRadius: 999, border: '1px solid',
              borderColor: filter === p ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  filter === p ? 'var(--pc-sage)' : 'transparent',
              color:       filter === p ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
            }}>
              {p === 'all' ? 'All' : PLATFORM_LABEL[p]}
              {p !== 'all' && (
                <span style={{ marginLeft: 5, opacity: 0.6 }}>
                  ({p === 'android' ? androidCount : p === 'ios' ? iosCount : bothCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No entries found</p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              {search || filter !== 'all' ? 'Try adjusting your filters.' : 'App waitlist signups will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['#', 'Phone', 'Platform', 'Signed Up'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => (
                  <tr key={entry.id} className="pc-table-row"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none' }}>
                    <td style={{ ...tdStyle, fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', width: 48 }}>
                      {idx + 1}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--pc-mono)', fontWeight: 500, color: 'var(--pc-fg)' }}>
                      {entry.phone}
                    </td>
                    <td style={{ ...tdStyle }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6,
                        background: 'var(--pc-card-hi)',
                        fontFamily: 'var(--pc-mono)', fontSize: 10, fontWeight: 600,
                        color: PLATFORM_COLOR[entry.platform] ?? 'var(--pc-fg-3)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {PLATFORM_LABEL[entry.platform] ?? entry.platform}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
