export default function AdminLoading() {
  return (
    <div className="admin-page-root">
      <style>{`@keyframes pc-pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Page title skeleton */}
      <div>
        <div style={{ height: 10, width: 80, background: 'var(--pc-card-hi)', borderRadius: 4, marginBottom: 10, animation: 'pc-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 28, width: 160, background: 'var(--pc-card-hi)', borderRadius: 6, animation: 'pc-pulse 1.5s ease-in-out infinite' }} />
      </div>

      {/* KPI cards */}
      <div className="kpi-grid-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 112,
              background: 'var(--pc-card)',
              borderRadius: 'var(--pc-radius-md)',
              border: '1px solid var(--pc-line)',
              animation: `pc-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Chart row */}
      <div className="charts-row-1-4-1">
        <div style={{ height: 240, background: 'var(--pc-card)', borderRadius: 'var(--pc-radius-md)', border: '1px solid var(--pc-line)', animation: 'pc-pulse 1.5s ease-in-out 0.2s infinite' }} />
        <div style={{ height: 240, background: 'var(--pc-card)', borderRadius: 'var(--pc-radius-md)', border: '1px solid var(--pc-line)', animation: 'pc-pulse 1.5s ease-in-out 0.3s infinite' }} />
      </div>

      {/* Table skeleton */}
      <div style={{ background: 'var(--pc-card)', borderRadius: 'var(--pc-radius-md)', border: '1px solid var(--pc-line)', overflow: 'hidden' }}>
        <div style={{ height: 48, borderBottom: '1px solid var(--pc-line)', padding: '0 var(--pc-space-5)', display: 'flex', alignItems: 'center' }}>
          <div style={{ height: 10, width: 140, background: 'var(--pc-card-hi)', borderRadius: 4, animation: 'pc-pulse 1.5s ease-in-out 0.1s infinite' }} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 52, borderBottom: i < 4 ? '1px solid var(--pc-line)' : 'none', padding: '0 var(--pc-space-5)', display: 'flex', alignItems: 'center', gap: 'var(--pc-space-8)' }}>
            <div style={{ height: 9, width: 72, background: 'var(--pc-card-hi)', borderRadius: 4, animation: `pc-pulse 1.5s ease-in-out ${i * 0.08}s infinite`, flexShrink: 0 }} />
            <div style={{ height: 9, width: 120, background: 'var(--pc-card-hi)', borderRadius: 4, animation: `pc-pulse 1.5s ease-in-out ${i * 0.08 + 0.05}s infinite` }} />
            <div style={{ height: 9, width: 90, background: 'var(--pc-card-hi)', borderRadius: 4, animation: `pc-pulse 1.5s ease-in-out ${i * 0.08 + 0.1}s infinite` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
