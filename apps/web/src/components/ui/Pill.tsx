interface PillProps {
  children: React.ReactNode;
  sage?: boolean;
  dark?: boolean;
  style?: React.CSSProperties;
}

export default function Pill({ children, sage, dark, style }: PillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--pc-space-1)',
        padding: 'var(--pc-space-1) var(--pc-space-3)',
        borderRadius: 'var(--pc-radius-pill)',
        fontFamily: 'var(--pc-sans)',
        fontSize: 'var(--pc-text-xs)',
        fontWeight: 500,
        background: sage ? 'var(--pc-sage)' : dark ? 'var(--pc-card)' : 'transparent',
        color: sage ? 'var(--pc-sage-ink)' : 'var(--pc-fg)',
        border: sage ? '1px solid var(--pc-sage-lo)' : '1px solid var(--pc-line)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
