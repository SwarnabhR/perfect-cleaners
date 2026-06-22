export default function WorkerLoading() {
  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
      <style>{`@keyframes pc-pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 'var(--pc-space-3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 10, width: 100, background: 'var(--pc-card-hi)', borderRadius: 4, animation: 'pc-pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 26, width: 160, background: 'var(--pc-card-hi)', borderRadius: 6, animation: 'pc-pulse 1.5s ease-in-out 0.1s infinite' }} />
        </div>
        <div style={{ height: 40, width: 110, background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999, animation: 'pc-pulse 1.5s ease-in-out 0.15s infinite' }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 88,
              background: 'var(--pc-card)',
              borderRadius: 'var(--pc-radius-md)',
              border: '1px solid var(--pc-line)',
              animation: `pc-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Assignment card */}
      <div style={{ height: 160, background: 'var(--pc-card)', borderRadius: 'var(--pc-radius-md)', border: '1px solid var(--pc-line)', animation: 'pc-pulse 1.5s ease-in-out 0.2s infinite' }} />

      {/* Log rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 60,
              background: 'var(--pc-card)',
              borderRadius: 'var(--pc-radius-md)',
              border: '1px solid var(--pc-line)',
              animation: `pc-pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
