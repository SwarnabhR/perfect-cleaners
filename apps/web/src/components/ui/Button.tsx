import Link from 'next/link';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'ghost';
type ButtonSize = 'md' | 'lg';

interface CommonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

type LinkButtonProps = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type ActionButtonProps = CommonProps & {
  href?: never;
  onClick: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
};

type ButtonProps = LinkButtonProps | ActionButtonProps;

// Shared pill-button primitive — every marketing CTA (Hero, USP, CTASection,
// For Societies, Services detail panel) was previously a hand-rolled inline
// style object with no hover state; this is the one place to fix both.
export default function Button({ children, variant = 'primary', size = 'lg', className, ...props }: ButtonProps) {
  const cls = [styles.btn, styles[variant], styles[size], className ?? ''].filter(Boolean).join(' ');

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  const { onClick, type = 'button', disabled } = props as ActionButtonProps;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
