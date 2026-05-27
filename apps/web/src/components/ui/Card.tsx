interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, style, onClick, ...props }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--pc-card)',
        border: '1px solid var(--pc-line)',
        borderRadius: 14,
        padding: 16,
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'background var(--pc-dur-base) var(--pc-ease)' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
