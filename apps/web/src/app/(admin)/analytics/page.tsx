import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

const KPIS = [
  { label: 'Total Revenue',    value: '₹4,28,900', delta: '+12.4%', icon: 'trending-up',  positive: true  },
  { label: 'Jobs Completed',   value: '1,847',      delta: '+8.1%',  icon: 'check-circle', positive: true  },
  { label: 'Avg Job Value',    value: '₹2,322',     delta: '-3.2%',  icon: 'bar-chart-2',  positive: false },
  { label: 'Customer Rating',  value: '4.87',       delta: '+0.06',  icon: 'star',         positive: true  },
];

export default function AnalyticsPage() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>ANALYTICS</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Performance Overview</h1>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--pc-card-hi)', padding: 4, borderRadius: 8 }}>
          {['7D', '30D', '90D', 'Custom'].map((range, i) => (
            <button type="button" key={range} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: i === 1 ? 'var(--pc-ink)' : 'transparent',
              color: i === 1 ? 'var(--pc-fg-inv)' : 'var(--pc-fg-3)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            }}>{range}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {KPIS.map(({ label, value, delta, icon, positive }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: positive ? 'var(--pc-sage)' : 'var(--pc-rust)', margin: 0 }}>{delta} vs last period</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

        {/* Revenue sparkline */}
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>REVENUE OVER TIME</Eyebrow>
          <div style={{ height: 240, position: 'relative' }}>
            <svg aria-hidden="true" viewBox="0 0 800 240" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {[0, 60, 120, 180, 240].map(y => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--pc-line)" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              <polygon
                points="0,240 0,200 40,180 80,150 120,190 160,110 200,160 240,90 280,130 320,60 360,140 400,100 440,120 480,80 520,110 560,40 600,90 640,30 680,60 720,20 760,50 800,10 800,240"
                fill="var(--pc-sage)" opacity="0.12"
              />
              <polyline
                points="0,200 40,180 80,150 120,190 160,110 200,160 240,90 280,130 320,60 360,140 400,100 440,120 480,80 520,110 560,40 600,90 640,30 680,60 720,20 760,50 800,10"
                fill="none" stroke="var(--pc-sage)" strokeWidth="2"
              />
            </svg>
          </div>
          {/* Month labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'].map(m => (
              <span key={m} style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)' }}>{m}</span>
            ))}
          </div>
        </Card>

        {/* Job type donut */}
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>JOB MIX</Eyebrow>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <svg aria-hidden="true" width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="56" fill="transparent" stroke="var(--pc-sage)"    strokeWidth="18" strokeDasharray="352" strokeDashoffset="0"   />
              <circle cx="70" cy="70" r="56" fill="transparent" stroke="var(--pc-warm)"   strokeWidth="18" strokeDasharray="352" strokeDashoffset="176" transform="rotate(-90 70 70)" />
              <circle cx="70" cy="70" r="56" fill="transparent" stroke="var(--pc-fg-4)"  strokeWidth="18" strokeDasharray="352" strokeDashoffset="281" transform="rotate(90 70 70)" />
            </svg>
          </div>
          {[{ label: 'Residential', color: 'var(--pc-sage)',  pct: '50%' },
            { label: 'Commercial',  color: 'var(--pc-warm)',  pct: '25%' },
            { label: 'One-off',     color: 'var(--pc-fg-4)',  pct: '25%' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: r.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{r.label}</span>
              </div>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 600 }}>{r.pct}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>

        {/* Top services */}
        <Card style={{ padding: 0, gridColumn: 'span 2' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--pc-line)' }}>
            <Eyebrow>TOP SERVICES BY REVENUE</Eyebrow>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Service', 'Jobs', 'Revenue', 'Avg Value', 'Trend'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { service: 'Deep Clean',      jobs: 412, revenue: '₹1,24,800', avg: '₹3,030', trend: '+14%' },
                { service: 'Regular Weekly',  jobs: 680, revenue: '₹98,600',  avg: '₹1,450', trend: '+6%'  },
                { service: 'Move-in/out',     jobs: 198, revenue: '₹87,200',  avg: '₹4,404', trend: '+22%' },
                { service: 'Office Clean',    jobs: 320, revenue: '₹76,800',  avg: '₹2,400', trend: '-2%'  },
                { service: 'Post-reno',       jobs: 237, revenue: '₹41,500',  avg: '₹1,750', trend: '+9%'  },
              ].map(row => (
                <tr key={row.service} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{row.service}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{row.jobs}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>{row.revenue}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{row.avg}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: row.trend.startsWith('+') ? 'var(--pc-sage)' : 'var(--pc-rust)' }}>{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Cancellation reasons */}
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>CANCELLATION REASONS</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0 32px' }}>
            <svg aria-hidden="true" width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage)"      strokeWidth="20" strokeDasharray="440" strokeDashoffset="0"   />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage-hi)"   strokeWidth="20" strokeDasharray="440" strokeDashoffset="242" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage-deep)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="338" transform="rotate(79 80 80)" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-fg-4)"     strokeWidth="20" strokeDasharray="440" strokeDashoffset="374" transform="rotate(158 80 80)" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Customer request', color: 'var(--pc-sage)',       pct: '45%' },
              { label: 'Weather',          color: 'var(--pc-sage-hi)',    pct: '22%' },
              { label: 'No-show',          color: 'var(--pc-sage-deep)',  pct: '18%' },
              { label: 'Reschedule',       color: 'var(--pc-fg-4)',       pct: '15%' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{r.label}</span>
                </div>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 600 }}>{r.pct}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
