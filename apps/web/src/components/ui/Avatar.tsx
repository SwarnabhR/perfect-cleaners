interface AvatarProps {
  name: string;
  size?: number;
  bg?: string;
}

export default function Avatar({ name, size = 32, bg = 'var(--pc-sage)' }: AvatarProps) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--pc-sans)', fontWeight: 600, fontSize: size * 0.38,
      color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

const STACK_COLORS = ['#A4736A', '#7A8A6F', '#86678A', '#6F8FA4'];

export function AvatarStack({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 22, height: 22, borderRadius: 999,
          background: STACK_COLORS[i % STACK_COLORS.length],
          border: '2px solid var(--pc-sage)',
          marginLeft: i === 0 ? 0 : -8,
        }} />
      ))}
    </div>
  );
}
