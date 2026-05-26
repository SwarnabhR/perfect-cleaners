interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, [string, string]> = {
  assigned: ['Assigned', '#6A8EAE'],
  enroute: ['En Route', '#D9A441'],
  inprogress: ['In Progress', '#5B6F52'],
  done: ['Done', '#6FAE6A'],
  cancelled: ['Cancelled', '#C9554E'],
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const [label, c] = STATUS_MAP[status] || ['—', '#888'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      fontFamily: 'var(--pc-sans)', fontSize: 11,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--pc-line)', color: 'var(--pc-fg-2)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />
      {label}
    </span>
  );
}
