interface LogoMarkProps {
  width?:  number;
  height?: number;
  color?:  string;
  style?:  React.CSSProperties;
}

/**
 * Inline PC monogram — uses currentColor so it follows var(--pc-fg)
 * automatically: white on dark backgrounds, near-black in light mode.
 */
export default function LogoMark({ width = 18, height = 22, color = 'currentColor', style }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 140"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      width={width}
      height={height}
      aria-hidden="true"
      style={style}
    >
      <line x1="32" y1="14" x2="32" y2="126" />
      <path d="M32 24 H78 a18 18 0 0 1 18 18 v0 a18 18 0 0 1 -18 18 H32" />
      <path d="M32 60 H72 a14 14 0 0 1 14 14 v0 a14 14 0 0 1 -14 14 H32" />
      <line x1="32" y1="100" x2="64" y2="100" />
    </svg>
  );
}
