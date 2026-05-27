interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

// Rendered as <span> so Eyebrow is valid in both block and inline contexts.
// Callers that need block layout should pass style={{ display: 'block' }}.
export default function Eyebrow({ children, color, style, className }: EyebrowProps) {
  return (
    <span
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
    </span>
  );
}
