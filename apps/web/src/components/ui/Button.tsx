/**
 * @deprecated PrimaryButton and GhostButton are no longer used in
 * this codebase. The correct patterns are:
 *
 *   Navigation CTAs  → <Link className="pc-hero-cta-primary"> or
 *                       <Link className="pc-hero-cta-ghost">
 *
 *   Interactive elements (non-navigation) → <button type="button">
 *
 * These exports remain to avoid a hard break, but should not be
 * imported in new code. Remove once confirmed no external consumers.
 */
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  full?: boolean;
}

/** @deprecated Use <Link className="pc-hero-cta-primary"> for navigation CTAs */
export function PrimaryButton({ children, full, style, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.primary} ${className ?? ''}`}
      style={{
        background: 'var(--pc-warm)',
        color: 'var(--pc-ink)',
        border: 'none',
        borderRadius: 'var(--pc-radius-pill)',
        padding: 'var(--pc-space-3) var(--pc-space-6)',
        fontFamily: 'var(--pc-sans)',
        fontSize: 'var(--pc-text-sm)',
        fontWeight: 600,
        letterSpacing: 'var(--pc-track-wide)',
        textTransform: 'uppercase',
        width: full ? '100%' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/** @deprecated Use <Link className="pc-hero-cta-ghost"> for navigation CTAs */
export function GhostButton({ children, full, style, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.ghost} ${className ?? ''}`}
      style={{
        background: 'transparent',
        color: 'var(--pc-fg)',
        border: '1px solid var(--pc-line-strong)',
        borderRadius: 'var(--pc-radius-pill)',
        padding: 'var(--pc-space-3) var(--pc-space-6)',
        fontFamily: 'var(--pc-sans)',
        fontSize: 'var(--pc-text-sm)',
        fontWeight: 500,
        letterSpacing: 'var(--pc-track-wide)',
        textTransform: 'uppercase',
        width: full ? '100%' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
