interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, [string, string]> = {
  assigned:   ['Assigned',    'var(--pc-status-assigned)'],
  enroute:    ['En Route',    'var(--pc-status-enroute)'],
  inprogress: ['In Progress', 'var(--pc-status-inprogress)'],
  done:       ['Done',        'var(--pc-status-done)'],
  cancelled:  ['Cancelled',   'var(--pc-danger)'],
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const [label, dotColor] = STATUS_MAP[status] || ['—', 'var(--pc-fg-3)'];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--pc-space-1)',
        padding: 'var(--pc-space-1) var(--pc-space-3)',
        borderRadius: 'var(--pc-radius-pill)',
        fontFamily: 'var(--pc-sans)',
        fontSize: 'var(--pc-text-xs)',
        letterSpacing: 'var(--pc-track-wide)',
        background: 'var(--pc-line-faint)',
        border: '1px solid var(--pc-line)',
        color: 'var(--pc-fg-2)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 'var(--pc-space-2)',
          height: 'var(--pc-space-2)',
          borderRadius: 'var(--pc-radius-pill)',
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
