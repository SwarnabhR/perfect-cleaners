interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function Eyebrow({ children, color, style, className }: EyebrowProps) {
  return (
    <div
      className={className}
      style={{
        fontFamily: 'var(--pc-mono)',
        fontSize: 'var(--pc-text-xs)',
        letterSpacing: 'var(--pc-track-mono)',
        textTransform: 'uppercase',
        color: color ?? 'var(--pc-fg-3)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
