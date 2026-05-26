interface PillProps {
  children: React.ReactNode;
  sage?: boolean;
  dark?: boolean;
  style?: React.CSSProperties;
}

export default function Pill({ children, sage, dark, style }: PillProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 12px',
      borderRadius: 999,
      fontFamily: 'var(--pc-sans)',
      fontSize: 12,
      fontWeight: 500,
      background: sage ? 'var(--pc-sage)' : dark ? 'var(--pc-card)' : 'transparent',
      color: sage ? '#fff' : 'var(--pc-fg)',
      border: sage ? 'none' : '1px solid var(--pc-line)',
      ...style,
    }}>
      {children}
    </span>
  );
}
