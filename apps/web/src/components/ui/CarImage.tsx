type Tone = 'dark' | 'sage' | 'light';

const PALETTES: Record<Tone, [string, string, string]> = {
  dark:  ['#1a1816', '#0a0908', '#2a2725'],
  sage:  ['#4A5E44', '#2f3d2c', '#5B6F52'],
  light: ['#3a3835', '#1a1816', '#26241f'],
};

interface CarImageProps {
  tone?: Tone;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function CarImage({ tone = 'dark', label, style, className }: CarImageProps) {
  const [a, b, c] = PALETTES[tone];
  return (
    <div
      className={className}
      style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        background: `radial-gradient(120% 80% at 50% 130%, ${c} 0%, ${b} 35%, ${a} 75%)`,
        border: '1px solid var(--pc-line)',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', top: '-30%', left: '20%', right: '20%', height: '80%',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
      }} />
      <svg viewBox="0 0 320 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="pcCarBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="148" rx="120" ry="6" fill="rgba(0,0,0,0.5)" />
        <path
          d="M30 132 Q40 120 60 116 L100 92 Q130 78 180 78 Q230 78 260 94 L290 110 Q304 116 304 130 L304 142 Q304 148 296 148 L262 148 Q258 158 248 158 Q238 158 234 148 L96 148 Q92 158 82 158 Q72 158 68 148 L34 148 Q26 148 26 142 Z"
          fill={a} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"
        />
        <path
          d="M30 132 Q40 120 60 116 L100 92 Q130 78 180 78 Q230 78 260 94 L290 110 Q304 116 304 130 L304 142 Q304 148 296 148 L262 148 Q258 158 248 158 Q238 158 234 148 L96 148 Q92 158 82 158 Q72 158 68 148 L34 148 Q26 148 26 142 Z"
          fill="url(#pcCarBody)"
        />
        <path
          d="M104 96 L130 82 Q160 74 180 74 Q220 74 244 92 L250 110 L98 110 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"
        />
        <line x1="170" y1="78" x2="170" y2="110" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <circle cx="82"  cy="148" r="14" fill="#0a0908" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        <circle cx="82"  cy="148" r="7"  fill="none"   stroke="rgba(255,255,255,0.3)"  strokeWidth="0.6" />
        <circle cx="248" cy="148" r="14" fill="#0a0908" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        <circle cx="248" cy="148" r="7"  fill="none"   stroke="rgba(255,255,255,0.3)"  strokeWidth="0.6" />
        <path d="M286 122 Q298 122 300 132 L286 132 Z" fill="rgba(255,250,230,0.4)" />
      </svg>
      {label && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', letterSpacing: '0.1em',
          color: 'var(--pc-fg-2)', textTransform: 'uppercase',
          border: '1px solid var(--pc-line)', padding: '3px 7px', borderRadius: 4,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}>
          [{label}]
        </div>
      )}
    </div>
  );
}
