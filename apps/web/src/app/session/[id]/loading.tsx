export default function SessionLoading() {
  return (
    <div className="pc-force-dark" style={{
      minHeight: '100dvh',
      background: 'var(--pc-ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--pc-sans, sans-serif)',
      color: 'var(--pc-fg-4)',
      fontSize: 13,
      letterSpacing: '0.04em',
    }}>
      Loading session…
    </div>
  );
}
