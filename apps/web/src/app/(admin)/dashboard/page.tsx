import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';

const KPIS = [
  { label: 'BOOKINGS TODAY', value: '47', delta: '+12%', dir: 'up' as const, icon: 'calendar' },
  { label: 'REVENUE TODAY', value: '₹52,840', delta: '+8%', dir: 'up' as const, icon: 'wallet' },
  { label: 'ACTIVE WORKERS', value: '11 / 14', delta: '—', dir: 'flat' as const, icon: 'users' },
  { label: 'PENDING ASSIGN', value: '3', delta: '−2', dir: 'down' as const, icon: 'clock' },
];

const BOOKINGS: [string, string, string, string, string, string, string][] = [
  ['#PC-2058', 'Aarav Mehta', 'BMW 3 Series', 'Premium Wash + Interior', 'Rahul S.', '10:30 AM', 'inprogress'],
  ['#PC-2057', 'Priya Singh', 'Honda City', 'Exterior Wash', 'Asha R.', '11:00 AM', 'enroute'],
  ['#PC-2056', 'Vikram Patel', 'Audi Q5', 'Premium + Coat', 'Unassigned', '2:00 PM', 'assigned'],
  ['#PC-2055', 'Neha Kapoor', 'Maruti Brezza', 'Interior Detail', 'Manoj K.', '4:30 PM', 'assigned'],
  ['#PC-2054', 'Sameer Khan', 'Tata Harrier', 'Exterior Wash', 'Sunil B.', '6:15 PM', 'done'],
  ['#PC-2053', 'Ananya Verma', 'Hyundai Creta', 'Premium Wash', 'Pradeep M.', '9:00 AM', 'done'],
];

const WORKERS: [string, number, number, string][] = [
  ['Rahul Sharma', 4.9, 312, '₹84,200'],
  ['Asha Rao', 4.9, 287, '₹78,300'],
  ['Vikrant Bose', 4.8, 264, '₹72,900'],
  ['Pradeep Menon', 4.8, 251, '₹68,400'],
  ['Sunil Bhardwaj', 4.7, 238, '₹61,000'],
];

const CHART_DATA = [22000, 28000, 19000, 41000, 33000, 52000, 48000];
const CHART_MAX = Math.max(...CHART_DATA);

const PINS: [number, number, string, string][] = [
  [20, 30, '#D9A441', 'Rahul'],
  [55, 24, '#5B6F52', 'Vikrant'],
  [70, 60, '#6FAE6A', 'Asha'],
  [30, 70, '#D9A441', 'Pradeep'],
  [80, 40, '#5B6F52', 'Manoj'],
  [42, 50, '#5B6F52', 'Sunil'],
];

export default function DashboardPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <Eyebrow>[DASHBOARD] · MONDAY, 27 MAY 2026</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff',
          letterSpacing: '-0.02em', marginTop: 8,
        }}>
          Today at a glance.
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {KPIS.map(({ label, value, delta, dir, icon }) => (
          <Card key={label} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 124 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Eyebrow>{label}</Eyebrow>
              <Icon name={icon} size={16} color="var(--pc-fg-3)" />
            </div>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 34, color: '#fff',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>{value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {dir !== 'flat' && (
                <Icon
                  name={dir === 'up' ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={dir === 'up' ? 'var(--pc-success)' : 'var(--pc-danger)'}
                />
              )}
              <span style={{
                fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.06em',
                color: dir === 'up' ? 'var(--pc-success)' : dir === 'down' ? 'var(--pc-danger)' : 'var(--pc-fg-3)',
              }}>{delta} vs YESTERDAY</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Live Map + Revenue Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        {/* Live Map */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--pc-line)',
          }}>
            <Eyebrow>[LIVE OPS] · 6 ACTIVE TECHNICIANS · DELHI NCR</Eyebrow>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {[['#D9A441', 'En route'], ['#5B6F52', 'In progress'], ['#6FAE6A', 'Done']].map(([c, l]) => (
                <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-2)', letterSpacing: '0.06em' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: c }} />
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 800 320" width="100%" height="320" style={{ display: 'block', background: 'transparent' }}>
            <g stroke="rgba(255,255,255,0.06)" fill="none">
              <path d="M-20 100 Q200 80 400 110 T820 100" strokeWidth="20" />
              <path d="M-20 220 Q200 200 400 230 T820 220" strokeWidth="14" />
              <path d="M120 -20 Q140 160 100 340" strokeWidth="16" />
              <path d="M360 -20 Q380 160 340 340" strokeWidth="14" />
              <path d="M600 -20 Q620 160 580 340" strokeWidth="16" />
            </g>
            <g stroke="rgba(255,255,255,0.12)" fill="none" strokeDasharray="2 5" strokeWidth="0.8">
              <path d="M-20 100 Q200 80 400 110 T820 100" />
              <path d="M-20 220 Q200 200 400 230 T820 220" />
              <path d="M120 -20 Q140 160 100 340" />
              <path d="M360 -20 Q380 160 340 340" />
              <path d="M600 -20 Q620 160 580 340" />
            </g>
            {[['NOIDA', 600, 80], ['INDIRAPURAM', 300, 70], ['KAVI NAGAR', 200, 250], ['VAISHALI', 480, 270]].map(([n, x, y]) => (
              <text key={n} x={x} y={y} fill="rgba(255,255,255,0.18)" fontFamily="var(--pc-mono)" fontSize="8" letterSpacing="2">{n}</text>
            ))}
            {PINS.map(([x, y, color, name], i) => (
              <g key={i} transform={`translate(${x * 8}, ${y * 3.2})`}>
                <circle cx="0" cy="0" r="12" fill={color} opacity="0.25" />
                <circle cx="0" cy="0" r="6" fill={color} stroke="#fff" strokeWidth="1" />
                <text x="10" y="4" fill="rgba(255,255,255,0.7)" fontFamily="var(--pc-mono)" fontSize="9" letterSpacing="1">{name.toUpperCase()}</text>
              </g>
            ))}
          </svg>
        </Card>

        {/* Revenue Chart */}
        <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Eyebrow>[REVENUE] · 7 DAYS</Eyebrow>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 30, color: '#fff',
              letterSpacing: '-0.02em', marginTop: 4,
            }}>₹2,43,000</div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-success)' }}>
              ↑ 18% from previous week
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="160" style={{ overflow: 'visible' }}>
            {[0, 25, 50, 75].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
            ))}
            <polygon
              points={`0,100 ${CHART_DATA.map((v, i) => `${(i / 6) * 100},${100 - (v / CHART_MAX) * 90}`).join(' ')} 100,100`}
              fill="rgba(91,111,82,0.25)"
            />
            <polyline
              points={CHART_DATA.map((v, i) => `${(i / 6) * 100},${100 - (v / CHART_MAX) * 90}`).join(' ')}
              fill="none"
              stroke="var(--pc-sage-hi)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
            />
            {CHART_DATA.map((v, i) => {
              const cx = (i / 6) * 100;
              const cy = 100 - (v / CHART_MAX) * 90;
              return <circle key={i} cx={cx} cy={cy} r="1.3" fill="#fff" stroke="var(--pc-sage-hi)" strokeWidth="0.5" />;
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)' }}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <span key={d}>{d}</span>)}
          </div>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>[RECENT BOOKINGS]</Eyebrow>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['All', 'Pending', 'In Progress', 'Done'].map((t, i) => (
              <span key={t} style={{
                padding: '5px 11px', borderRadius: 999,
                fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                background: i === 0 ? 'var(--pc-warm)' : 'transparent',
                color: i === 0 ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
                border: i === 0 ? 'none' : '1px solid var(--pc-line)',
                cursor: 'pointer',
              }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '90px 1.4fr 1fr 1.4fr 1fr 80px 130px 60px',
          padding: '10px 18px', borderBottom: '1px solid var(--pc-line)', gap: 14,
        }}>
          {['BOOKING', 'CUSTOMER', 'CAR', 'SERVICE', 'WORKER', 'TIME', 'STATUS', ''].map(h => (
            <div key={h} style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {BOOKINGS.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '90px 1.4fr 1fr 1.4fr 1fr 80px 130px 60px',
            padding: '12px 18px', borderBottom: i < BOOKINGS.length - 1 ? '1px solid var(--pc-line)' : 'none',
            gap: 14, alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)', letterSpacing: '0.04em' }}>{r[0]}</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff' }}>{r[1]}</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{r[2]}</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: '#fff' }}>{r[3]}</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: r[4] === 'Unassigned' ? 'var(--pc-warning)' : 'var(--pc-fg-2)' }}>{r[4]}</span>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{r[5]}</span>
            <StatusBadge status={r[6] as any} />
            <Icon name="more-horizontal" size={14} color="var(--pc-fg-3)" />
          </div>
        ))}
      </Card>

      {/* Worker Leaderboard */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>[TOP WORKERS] · BY RATING</Eyebrow>
        </div>
        {WORKERS.map(([name, rating, jobs, earn], i) => (
          <div key={name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            borderBottom: i < WORKERS.length - 1 ? '1px solid var(--pc-line)' : 'none',
          }}>
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', width: 18 }}>
              {`0${i + 1}`}
            </div>
            <Avatar name={name} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff', fontWeight: 500 }}>{name}</div>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: '0.06em' }}>{jobs} JOBS</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="star" size={12} color="var(--pc-gold)" />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff' }}>{rating}</span>
            </div>
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)', minWidth: 70, textAlign: 'right' }}>{earn}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
