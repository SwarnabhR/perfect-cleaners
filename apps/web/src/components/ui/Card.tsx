import React from 'react';
import styles from './Card.module.css';

type CardBaseProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  hover?: boolean;
  className?: string;
};

type InteractiveCardProps = CardBaseProps & {
  onClick: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'style' | 'className'>;

type StaticCardProps = CardBaseProps & {
  onClick?: undefined;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick' | 'style' | 'className'>;

type CardProps = InteractiveCardProps | StaticCardProps;

export default function Card({ children, style, onClick, hover, className, ...props }: CardProps) {
  const interactive = !!onClick || hover;
  const cls = [styles.card, interactive ? styles.interactive : '', className ?? ''].filter(Boolean).join(' ');

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cls}
        style={style}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={cls}
      style={style}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}
