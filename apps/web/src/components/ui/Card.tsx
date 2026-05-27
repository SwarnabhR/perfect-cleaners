import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, style, onClick, hover, ...props }: CardProps) {
  const interactive = !!onClick || hover;
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: 'var(--pc-card)',
        border: '1px solid var(--pc-line)',
        borderRadius: 'var(--pc-radius-md)',
        padding: 'var(--pc-space-4)',
        cursor: interactive ? 'pointer' : undefined,
        transition: interactive
          ? 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)'
          : undefined,
        ...style,
      }}
      onMouseEnter={interactive ? e => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--pc-card-hi)';
      } : undefined}
      onMouseLeave={interactive ? e => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--pc-card)';
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
