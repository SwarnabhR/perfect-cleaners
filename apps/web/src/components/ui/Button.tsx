import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  full?: boolean;
}

export function PrimaryButton({ children, full, style, className, ...props }: ButtonProps) {
  return (
    <button
      className={`${styles.primary} ${className ?? ''}`}
      style={{
        background: 'var(--pc-warm)',
        color: 'var(--pc-ink)',
        border: 'none',
        borderRadius: 999,
        padding: '12px 22px',
        fontFamily: 'var(--pc-sans)',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, full, style, ...props }: ButtonProps) {
  return (
    <button
      style={{
        background: 'transparent',
        color: 'var(--pc-fg)',
        border: '1px solid var(--pc-line-strong)',
        borderRadius: 999,
        padding: '11px 22px',
        fontFamily: 'var(--pc-sans)',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
