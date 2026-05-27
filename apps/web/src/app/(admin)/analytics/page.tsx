'use client';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';

export default function AnalyticsPage() {
  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Eyebrow>[ANALYTICS]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', margin: '8px 0 0' }}>
            Reports & Insights
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--pc-card-hi)', padding: 4, borderRadius: 8 }}>
          {['7D', '30D', '90D', 'Custom'].map((range, i) => (
            <button key={range} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: i === 1 ? 'var(--pc-ink)' : 'transparent',
              color: i === 1 ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
            }}>{range}</button>
          ))}
        </div>
      </header>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <Card>
          <Eyebrow>Total Revenue</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>₹8,42,300</div>
          <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-success)', marginTop: 4 }}>+12% vs last period</div>
        </Card>
        <Card>
          <Eyebrow>Total Bookings</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>847</div>
          <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-success)', marginTop: 4 }}>+5% vs last period</div>
        </Card>
        <Card>
          <Eyebrow>Avg Order Value</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>₹994</div>
          <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-success)', marginTop: 4 }}>+2% vs last period</div>
        </Card>
        <Card>
          <Eyebrow>Repeat Rate</Eyebrow>
          <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 32, color: 'var(--pc-fg)', marginTop: 8 }}>68%</div>
          <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-success)', marginTop: 4 }}>+4% vs last period</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>REVENUE OVER TIME</Eyebrow>
          <div style={{ height: 240, position: 'relative' }}>
            <svg viewBox="0 0 800 240" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 60, 120, 180, 240].map(y => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--pc-line)" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              {/* Line graph */}
              <polyline 
                points="0,200 40,180 80,150 120,190 160,110 200,160 240,90 280,130 320,60 360,140 400,100 440,120 480,80 520,110 560,40 600,90 640,30 680,60 720,20 760,50 800,10" 
                fill="none" 
                stroke="var(--pc-sage)" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Area under line */}
              <polygon 
                points="0,240 0,200 40,180 80,150 120,190 160,110 200,160 240,90 280,130 320,60 360,140 400,100 440,120 480,80 520,110 560,40 600,90 640,30 680,60 720,20 760,50 800,10 800,240" 
                fill="url(#sageGradient)" 
              />
              <defs>
                <linearGradient id="sageGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--pc-sage)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--pc-sage)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </Card>

        {/* Bookings by service */}
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>BOOKINGS BY SERVICE</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'Exterior Wash', count: 312, max: 312 },
              { name: 'Interior Detailing', count: 284, max: 312 },
              { name: 'Ceramic', count: 98, max: 312 },
              { name: 'Other', count: 86, max: 312 },
              { name: 'Paint Protection', count: 67, max: 312 },
            ].map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{s.name}</span>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
        <Card style={{ padding: 0, gridColumn: 'span 2' }}>
          <div style={{ padding: 24, borderBottom: '1px solid var(--pc-line)' }}>
            <Eyebrow>TOP 5 REVENUE DAYS</Eyebrow>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['DATE', 'BOOKINGS', 'REVENUE'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', fontWeight: 500 }}>{h}</th>
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
              ].map(d => (
                <tr key={d.date} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  <td style={{ padding: '16px 24px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{d.date}</td>
                  <td style={{ padding: '16px 24px', fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{d.bookings}</td>
                  <td style={{ padding: '16px 24px', fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg-2)' }}>₹{d.rev.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        
        <Card>
          <Eyebrow style={{ marginBottom: 24, display: 'block' }}>CANCELLATION REASONS</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0 32px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="0" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-sage-hi)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="242" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#3A4D36" strokeWidth="20" strokeDasharray="440" strokeDashoffset="338" transform="rotate(79 80 80)" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--pc-fg-4)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="374" transform="rotate(158 80 80)" />
              <text x="80" y="80" textAnchor="middle" dominantBaseline="middle" fill="var(--pc-fg)" style={{ fontFamily: 'var(--pc-serif)', fontSize: 24 }}>4.2%</text>
              <text x="80" y="98" textAnchor="middle" fill="var(--pc-fg-3)" style={{ fontFamily: 'var(--pc-sans)', fontSize: 10 }}>CANCEL RATE</text>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pc-sage)' }}/> Customer request</div>
              <span style={{ fontFamily: 'var(--pc-mono)', color: 'var(--pc-fg-2)' }}>45%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pc-sage-hi)' }}/> Weather</div>
              <span style={{ fontFamily: 'var(--pc-mono)', color: 'var(--pc-fg-2)' }}>22%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#3A4D36' }}/> No-show</div>
              <span style={{ fontFamily: 'var(--pc-mono)', color: 'var(--pc-fg-2)' }}>18%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--pc-sans)', color: 'var(--pc-fg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pc-fg-4)' }}/> Reschedule</div>
              <span style={{ fontFamily: 'var(--pc-mono)', color: 'var(--pc-fg-2)' }}>15%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
