interface StatusPillProps {
  status: string;
}

// bg/border are derived from the same text token via color-mix so a future
// tweak to --pc-warning/--pc-danger/etc. can't drift the fill out of sync
// with the dot/text colour (see CLAUDE.md: always use var(--pc-*), never
// hardcode the rgba breakdown of a token).
function tint(colorVar: string, bgPct: number, borderPct: number) {
  return {
    text:   `var(${colorVar})`,
    bg:     `color-mix(in srgb, var(${colorVar}) ${bgPct}%, transparent)`,
    border: `color-mix(in srgb, var(${colorVar}) ${borderPct}%, transparent)`,
  };
}

const PALETTE: Record<string, { text: string; bg: string; border: string }> = {
  // Booking pipeline
  'Pending':     tint('--pc-warning', 12, 20),
  'Confirmed':   tint('--pc-info',    12, 20),
  'En Route':    tint('--pc-warning', 12, 20),
  'Arrived':     tint('--pc-info',    12, 20),
  'In Progress': tint('--pc-sage',    12, 20),
  'Done':        tint('--pc-success', 12, 20),
  'Cancelled':   tint('--pc-danger',  12, 20),
  'Missed':      tint('--pc-danger',  12, 20),
  // Subscription status
  'Active':      tint('--pc-success', 12, 20),
  'Paused':      tint('--pc-fg-3',     8, 14),
  // Worker status
  'Available':   tint('--pc-sage',    12, 20),
  'On Job':      tint('--pc-warning', 12, 20),
  'Off Today':   tint('--pc-fg-3',     8, 14),
  // Notification delivery status
  'Sent':        tint('--pc-success', 12, 20),
  'Failed':      tint('--pc-danger',  12, 20),
};

const FALLBACK = tint('--pc-fg-3', 8, 14);

export default function StatusPill({ status }: StatusPillProps) {
  const s = PALETTE[status] ?? FALLBACK;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 500,
      letterSpacing: '0.02em',
      color: s.text, background: s.bg,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true" style={{
        width: 5, height: 5, borderRadius: 999,
        background: 'currentColor', flexShrink: 0,
      }} />
      {status}
    </span>
  );
}
