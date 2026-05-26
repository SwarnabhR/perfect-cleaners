import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';

const WORKERS = [
  { name: 'Rahul Sharma',   zone: 'Indirapuram',    rating: 4.9, jobs: 312, weekly: '₹18,200', monthly: '₹84,200', status: 'on-duty',  skills: ['Exterior', 'Interior', 'Ceramic Coat'],        onTime: '97%', active: true  },
  { name: 'Asha Rao',       zone: 'Vaishali',       rating: 4.9, jobs: 287, weekly: '₹17,400', monthly: '₹78,300', status: 'on-duty',  skills: ['Exterior', 'Interior', 'Detailing'],           onTime: '98%', active: true  },
  { name: 'Vikrant Bose',   zone: 'Kaushambi',      rating: 4.8, jobs: 264, weekly: '₹16,100', monthly: '₹72,900', status: 'en-route', skills: ['Exterior', 'PPF', 'Ceramic Coat'],             onTime: '95%', active: true  },
  { name: 'Pradeep Menon',  zone: 'Raj Nagar Ext.', rating: 4.8, jobs: 251, weekly: '₹15,300', monthly: '₹68,400', status: 'on-duty',  skills: ['Interior', 'Detailing', 'Engine Bay'],         onTime: '96%', active: true  },
  { name: 'Sunil Bhardwaj', zone: 'Vasundhara',     rating: 4.7, jobs: 238, weekly: '₹13,800', monthly: '₹61,000', status: 'on-duty',  skills: ['Exterior', 'Interior'],                        onTime: '94%', active: true  },
  { name: 'Manoj Kumar',    zone: 'Indirapuram',    rating: 4.7, jobs: 203, weekly: '₹12,100', monthly: '₹53,400', status: 'idle',     skills: ['Exterior', 'Interior', 'Detailing'],           onTime: '93%', active: true  },
  { name: 'Deepika Nair',   zone: 'Crossings Rep.', rating: 4.6, jobs: 174, weekly: '₹9,400',  monthly: '₹44,200', status: 'off-duty', skills: ['Interior', 'Leather Conditioning'],            onTime: '96%', active: false },
  { name: 'Aryan Tiwari',   zone: 'Kavi Nagar',     rating: 4.6, jobs: 158, weekly: '₹8,200',  monthly: '₹38,900', status: 'off-duty', skills: ['Exterior', 'Tyre Dressing'],                   onTime: '91%', active: false },
];

const STATUS_COLORS: Record<string, string> = {
  'on-duty': '#6FAE6A',
  'en-route': '#D9A441',
  'idle': '#6A8EAE',
  'off-duty': 'var(--pc-fg-4)',
};

const STATUS_LABELS: Record<string, string> = {
  'on-duty': 'On Duty',
  'en-route': 'En Route',
  'idle': 'Idle',
  'off-duty': 'Off Duty',
};

const STATS = [
  { label: 'ACTIVE TODAY', value: '11 / 14', icon: 'users' },
  { label: 'EN ROUTE', value: '3', icon: 'navigation' },
  { label: 'TOTAL THIS MONTH', value: '₹5,61,400', icon: 'wallet' },
  { label: 'AVG RATING', value: '4.8', icon: 'star' },
];

const COLS = ['WORKER', 'ZONE', 'TODAY STATUS', 'RATING', 'JOBS', 'THIS WEEK', 'ON-TIME', 'SKILLS', ''];
const COLS_TEMPLATE = '1.4fr 130px 130px 80px 70px 100px 80px 1fr 40px';

export default function WorkersPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>[WORKERS] · 14 REGISTERED</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>
            Your team.
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="user-plus" size={14} color="var(--pc-ink)" />
          Add Worker
        </button>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={icon} size={16} color="var(--pc-fg-2)" />
            </div>
            <div>
              <Eyebrow>{label}</Eyebrow>
              <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 26, color: '#fff', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['All', 'On Duty', 'En Route', 'Idle', 'Off Duty'].map((t, i) => (
          <span key={t} style={{
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: i === 0 ? 'var(--pc-warm)' : 'transparent',
            color: i === 0 ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
            border: i === 0 ? 'none' : '1px solid var(--pc-line)',
          }}>{t}</span>
        ))}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
          borderRadius: 8, padding: '7px 12px',
        }}>
          <Icon name="search" size={13} color="var(--pc-fg-3)" />
          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>Search workers...</span>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: COLS_TEMPLATE,
          padding: '10px 18px', borderBottom: '1px solid var(--pc-line)', gap: 12,
        }}>
          {COLS.map(h => (
            <div key={h} style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {WORKERS.map((w, i) => (
          <div key={w.name} style={{
            display: 'grid', gridTemplateColumns: COLS_TEMPLATE,
            padding: '13px 18px', gap: 12, alignItems: 'center',
            borderBottom: i < WORKERS.length - 1 ? '1px solid var(--pc-line)' : 'none',
            cursor: 'pointer',
            opacity: w.active ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={w.name} size={30} />
              <div>
                <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff', fontWeight: 500 }}>{w.name}</div>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: '0.04em' }}>{w.zone}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_COLORS[w.status], flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{STATUS_LABELS[w.status]}</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="star" size={11} color="var(--pc-gold)" />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff' }}>{w.rating}</span>
            </div>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{w.jobs}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: '#fff' }}>{w.weekly}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{w.onTime}</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {w.skills.slice(0, 2).map(s => (
                <span key={s} style={{
                  padding: '3px 8px', borderRadius: 999,
                  background: 'rgba(91,111,82,0.18)', border: '1px solid rgba(91,111,82,0.4)',
                  fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-sage-hi)',
                }}>{s}</span>
              ))}
              {w.skills.length > 2 && (
                <span style={{
                  padding: '3px 8px', borderRadius: 999,
                  background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                  fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-3)',
                }}>+{w.skills.length - 2}</span>
              )}
            </div>
            <Icon name="more-horizontal" size={14} color="var(--pc-fg-3)" />
          </div>
        ))}
      </Card>
    </div>
  );
}
