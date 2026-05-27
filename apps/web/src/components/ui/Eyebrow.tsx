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
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: color ?? 'var(--pc-fg-3)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
