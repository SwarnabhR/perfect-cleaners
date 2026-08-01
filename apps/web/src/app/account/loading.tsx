export default function AccountLoading() {
  return (
    <div style={{ padding: 'var(--pc-space-5) var(--pc-screen-pad-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
      <style>{`@keyframes pc-pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 'var(--pc-space-3)' }}>
        <div style={{ height: 10, width: 100, background: 'var(--pc-card-hi)', borderRadius: 4, animation: 'pc-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 26, width: 180, background: 'var(--pc-card-hi)', borderRadius: 6, animation: 'pc-pulse 1.5s ease-in-out 0.1s infinite' }} />
      </div>

      {/* Summary card */}
      <div style={{ height: 140, background: 'var(--pc-card)', borderRadius: 'var(--pc-radius-md)', border: '1px solid var(--pc-line)', animation: 'pc-pulse 1.5s ease-in-out 0.15s infinite' }} />

      {/* List rows */}
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
