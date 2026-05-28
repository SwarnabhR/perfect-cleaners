import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

const KPIS = [
  { label: 'Revenue (MTD)',   value: '\u20b938,420', delta: '+14.2%', icon: 'trending-up',   positive: true  },
  { label: 'Jobs Today',      value: '24',          delta: '+3',     icon: 'calendar',      positive: true  },
  { label: 'Active Workers',  value: '18',          delta: '-1',     icon: 'users',         positive: false },
  { label: 'Customer NPS',    value: '72',          delta: '+5 pts', icon: 'heart',         positive: true  },
];

const RECENT_BOOKINGS = [
  { id: '#B-1048', customer: 'Priya Sharma',   service: 'Deep Clean',    time: '09:00', status: 'In Progress', worker: 'Rajan K.' },
  { id: '#B-1049', customer: 'Arjun Mehta',    service: 'Regular',       time: '10:30', status: 'Confirmed',   worker: 'Sunita D.' },
  { id: '#B-1050', customer: 'Kavya Iyer',     service: 'Move-in Clean', time: '12:00', status: 'Confirmed',   worker: 'Mohan R.' },
  { id: '#B-1051', customer: 'Ravi Gupta',     service: 'Office Clean',  time: '14:00', status: 'Pending',     worker: 'Unassigned' },
  { id: '#B-1052', customer: 'Sneha Pillai',   service: 'Post-reno',     time: '15:30', status: 'Confirmed',   worker: 'Deepa S.' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Progress': 'var(--pc-sage)',
  'Confirmed':   'var(--pc-warm)',
  'Pending':     'var(--pc-fg-3)',
};

const TOP_WORKERS = [
  { name: 'Rajan Kumar',  jobs: 48, rating: 4.97, revenue: '\u20b912,400' },
  { name: 'Sunita Devi',  jobs: 42, rating: 4.94, revenue: '\u20b910,800' },
  { name: 'Mohan Rao',    jobs: 39, rating: 4.91, revenue: '\u20b99,750'  },
  { name: 'Deepa Singh',  jobs: 36, rating: 4.88, revenue: '\u20b99,100'  },
];

export default function DashboardPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Page title */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OVERVIEW</Eyebrow>
        <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Dashboard</h1>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {KPIS.map(({ label, value, delta, icon, positive }) => (
          <Card key={label} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 124 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
              <Icon name={icon} size={14} color="var(--pc-fg-4)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 26, color: 'var(--pc-fg)', margin: '0 0 4px' }}>{value}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name={positive ? 'arrow-up-right' : 'arrow-down-right'} size={12} color={positive ? 'var(--pc-sage)' : 'var(--pc-rust)'} />
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: positive ? 'var(--pc-sage)' : 'var(--pc-rust)' }}>{delta} vs last month</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>

        {/* Revenue chart */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Eyebrow>REVENUE — LAST 30 DAYS</Eyebrow>
          </div>
          <div style={{ padding: '12px 20px 0', display: 'flex', gap: 14, alignItems: 'center' }}>
            {[{ label: 'Revenue', c: 'var(--pc-sage)' }, { label: 'Target', c: 'var(--pc-warm)' }].map(({ label, c }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c }} />
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>{label}</span>
              </div>
            ))}
          </div>
          <svg aria-hidden="true" viewBox="0 0 800 320" width="100%" height="320" style={{ display: 'block', background: 'transparent' }}>
            <g stroke="rgba(255,255,255,0.06)" fill="none">
              <path d="M-20 100 Q200 80 400 110 T820 100" strokeWidth="20" />
              <path d="M-20 220 Q200 200 400 230 T820 220" strokeWidth="14" />
              <path d="M120 -20 Q140 160 100 340" strokeWidth="16" />
            </g>
            {[80, 160, 240].map(y => (
              <line key={y} x1="40" y1={y} x2="780" y2={y} stroke="var(--pc-line)" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            <polygon
              points="40,320 40,280 110,240 180,260 250,180 320,220 390,150 460,190 530,120 600,160 670,90 740,110 780,80 780,320"
              fill="var(--pc-sage)" opacity="0.08"
            />
            <polyline
              points="40,280 110,240 180,260 250,180 320,220 390,150 460,190 530,120 600,160 670,90 740,110 780,80"
              fill="none" stroke="var(--pc-sage)" strokeWidth="2"
            />
            <polyline
              points="40,260 110,250 180,240 250,220 320,230 390,200 460,210 530,180 600,190 670,160 740,155 780,140"
              fill="none" stroke="var(--pc-warm)" strokeWidth="1.5" strokeDasharray="6 3"
            />
          </svg>
        </Card>

        {/* Worker utilisation */}
        <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Eyebrow>WORKER UTILISATION</Eyebrow>
          {TOP_WORKERS.map(w => (
            <div key={w.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{w.name}</span>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>{w.jobs} jobs</span>
              </div>
              <div style={{ height: 4, background: 'var(--pc-card-hi)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(w.jobs / 50) * 100}%`, background: 'var(--pc-sage)', borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent bookings */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>RECENT BOOKINGS</Eyebrow>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <Icon name="sliders-horizontal" size={14} color="var(--pc-fg-3)" />
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="160" style={{ overflow: 'visible' }}>
          {[0, 25, 50, 75].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
          ))}
          <polygon
            points="0,100 0,80 10,75 20,65 30,70 40,50 50,60 60,40 70,45 80,30 90,35 100,20 100,100"
            fill="var(--pc-sage)" opacity="0.1"
          />
          <polyline
            points="0,80 10,75 20,65 30,70 40,50 50,60 60,40 70,45 80,30 90,35 100,20"
            fill="none" stroke="var(--pc-sage)" strokeWidth="0.5"
          />
        </svg>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              {['Booking', 'Customer', 'Service', 'Time', 'Worker', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_BOOKINGS.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                <td style={{
                  padding: '14px 20px', gap: 14, alignItems: 'center',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', fontWeight: 500,
                }}>{b.id}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{b.customer}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{b.service}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{b.time}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{b.worker}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500,
                    color: STATUS_COLORS[b.status] || 'var(--pc-fg-3)',
                    background: 'var(--pc-card-hi)', padding: '3px 10px', borderRadius: 999,
                  }}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Top workers */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>TOP PERFORMERS THIS MONTH</Eyebrow>
        </div>
        {TOP_WORKERS.map((w, i) => (
          <div key={w.name} style={{
            padding: '16px 20px', borderBottom: i < TOP_WORKERS.length - 1 ? '1px solid var(--pc-line)' : 'none',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 18, fontWeight: 600, color: 'var(--pc-fg-4)', minWidth: 24 }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{w.name}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{w.jobs} jobs · \u2605 {w.rating}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="indian-rupee" size={12} color="var(--pc-sage)" />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)' }}>{w.revenue}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
