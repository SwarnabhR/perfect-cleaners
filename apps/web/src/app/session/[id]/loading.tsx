export default function SessionLoading() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0E0D0B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'rgba(255,255,255,0.3)',
      fontSize: 13,
      letterSpacing: '0.04em',
    }}>
      Loading session…
    </div>
  );
}
