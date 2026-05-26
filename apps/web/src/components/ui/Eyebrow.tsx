interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
}

export default function Eyebrow({ children, color }: EyebrowProps) {
  return (
    <div style={{
      fontFamily: 'var(--pc-mono)',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: color ?? 'var(--pc-fg-3)',
    }}>
      {children}
    </div>
  );
}
