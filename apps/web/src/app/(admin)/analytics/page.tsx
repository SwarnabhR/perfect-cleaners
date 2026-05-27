import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const KPIS = [
  { label: 'TOTAL REVENUE',   value: '₹8,42,300', delta: '+12% vs last period', icon: 'wallet'      },
  { label: 'TOTAL BOOKINGS',  value: '847',        delta: '+5% vs last period',  icon: 'calendar'    },
  { label: 'AVG ORDER VALUE', value: '₹994',       delta: '+2% vs last period',  icon: 'trending-up' },
  { label: 'REPEAT RATE',     value: '68%',        delta: '+4% vs last period',  icon: 'repeat'      },
];

export default function AnalyticsPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>[ANALYTICS] · 30D</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>
            Reports & Insights.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--pc-card-hi)', padding: 4, borderRadius: 8 }}>
          {['7D', '30D', '90D', 'Custom'].map((range, i) => (
            <button key={range} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: i === 1 ? 'var(--pc-ink)' : 'transparent',
              color: i === 1 ? '#fff' : 'var(--pc-fg-3)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            }}>{range}</button>
          ))}
        </div>
      </div>

      {/* KPI Grid — matches dashboard/bookings/workers/customers pattern */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {KPIS.map(({ label, value, delta, icon }) => (
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
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-success)', marginTop: 2 }}>{delta}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + Bookings by Service */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>REVENUE OVER TIME</Eyebrow>
          <div style={{ height: 240, position: 'relative' }}>
            <svg viewBox="0 0 800 240" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {[0, 60, 120, 180, 240].map(y => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--pc-line)" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              <polygon
                points="0,240 0,200 40,180 80,150 120,190 160,110 200,160 240,90 280,130 320,60 360,140 400,100 440,120 480,80 520,110 560,40 600,90 640,30 680,60 720,20 760,50 800,10 800,240"
                fill="url(#sageGradient)"
              />
              <polyline
                points="0,200 40,180 80,150 120,190 160,110 200,160 240,90 280,130 320,60 360,140 400,100 440,120 480,80 520,110 560,40 600,90 640,30 680,60 720,20 760,50 800,10"
                fill="none"
                stroke="var(--pc-sage-hi)" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="sageGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--pc-sage)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--pc-sage)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', marginTop: 8 }}>
            {['29 Apr', '5 May', '12 May', '19 May', '26 May', '28 May'].map(d => <span key={d}>{d.toUpperCase()}</span>)}
          </div>
        </Card>

        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>BOOKINGS BY SERVICE</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'Exterior Wash',     count: 312, max: 312 },
              { name: 'Interior Detailing',count: 284, max: 312 },
              { name: 'Ceramic',           count: 98,  max: 312 },
              { name: 'Other',             count: 86,  max: 312 },
              { name: 'Paint Protection',  count: 67,  max: 312 },
            ].map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{s.count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--pc-card-hi)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.count / s.max) * 100}%`, background: 'var(--pc-sage)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Revenue Days + Cancellation Reasons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
        <Card style={{ padding: 0, gridColumn: 'span 2' }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--pc-line)' }}>
            <Eyebrow>TOP 5 REVENUE DAYS</Eyebrow>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['DATE', 'BOOKINGS', 'REVENUE'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-3)', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: '26 May 2026', bookings: 42, rev: 45200 },
                { date: '25 May 2026', bookings: 38, rev: 38900 },
                { date: '19 May 2026', bookings: 45, rev: 37400 },
                { date: '20 May 2026', bookings: 32, rev: 32100 },
                { date: '12 May 2026', bookings: 36, rev: 31500 },
              ].map((d, i) => (
                <tr key={d.date} style={{ borderBottom: i < 4 ? '1px solid var(--pc-line)' : 'none' }}>
                  <td style={{ padding: '14px 24px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff' }}>{d.date}</td>
                  <td style={{ padding: '14px 24px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>{d.bookings}</td>
                  <td style={{ padding: '14px 24px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: '#fff' }}>₹{d.rev.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>CANCELLATION REASONS</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0 32px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage)"    strokeWidth="20" strokeDasharray="440" strokeDashoffset="0"   />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage-hi)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="242" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#3A4D36"           strokeWidth="20" strokeDasharray="440" strokeDashoffset="338" transform="rotate(79 80 80)" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-fg-4)"   strokeWidth="20" strokeDasharray="440" strokeDashoffset="374" transform="rotate(158 80 80)" />
              <text x="80" y="78" textAnchor="middle" dominantBaseline="middle" fill="#fff" style={{ fontFamily: 'var(--pc-serif)', fontSize: 24 }}>4.2%</text>
              <text x="80" y="96" textAnchor="middle" fill="var(--pc-fg-3)" style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: 2 }}>CANCEL RATE</text>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Customer request', color: 'var(--pc-sage)',    pct: '45%' },
              { label: 'Weather',          color: 'var(--pc-sage-hi)', pct: '22%' },
              { label: 'No-show',          color: '#3A4D36',           pct: '18%' },
              { label: 'Reschedule',       color: 'var(--pc-fg-4)',    pct: '15%' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--pc-sans)', fontSize: 12, color: '#fff' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color, flexShrink: 0 }} />
                  {r.label}
                </div>
                <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)' }}>{r.pct}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
