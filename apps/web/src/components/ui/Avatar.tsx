interface AvatarProps {
  name: string;
  size?: number;
  bg?: string;
}

export default function Avatar({ name, size = 32, bg = 'var(--pc-sage)' }: AvatarProps) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 'var(--pc-radius-pill)',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--pc-sans)', fontWeight: 600,
      fontSize: size * 0.38,
      color: 'var(--pc-sage-ink)', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// Status-mapped avatar stack colours — derived from booking status tokens
const STACK_COLORS = [
  'var(--pc-status-enroute)',
  'var(--pc-status-inprogress)',
  'var(--pc-error)',
  'var(--pc-status-assigned)',
];

export function AvatarStack({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 22, height: 22,
          borderRadius: 'var(--pc-radius-pill)',
          background: STACK_COLORS[i % STACK_COLORS.length],
          border: '2px solid var(--pc-ink)',
          marginLeft: i === 0 ? 0 : 'calc(var(--pc-space-2) * -1)',
        }} />
      ))}
    </div>
  );
}
