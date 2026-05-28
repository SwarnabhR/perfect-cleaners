interface StatusPillProps {
  status: string;
}

const PALETTE: Record<string, { text: string; bg: string; border: string }> = {
  // Booking pipeline
  'In Progress': { text: 'var(--pc-sage)',    bg: 'rgba(74,94,68,0.12)',    border: 'rgba(74,94,68,0.2)'    },
  'Confirmed':   { text: 'var(--pc-info)',    bg: 'rgba(106,142,174,0.12)', border: 'rgba(106,142,174,0.2)' },
  'Pending':     { text: 'var(--pc-warning)', bg: 'rgba(217,164,65,0.12)',  border: 'rgba(217,164,65,0.2)'  },
  'Cancelled':   { text: 'var(--pc-danger)',  bg: 'rgba(201,85,78,0.12)',   border: 'rgba(201,85,78,0.2)'   },
  // Worker status
  'Available':   { text: 'var(--pc-sage)',    bg: 'rgba(74,94,68,0.12)',    border: 'rgba(74,94,68,0.2)'    },
  'On Job':      { text: 'var(--pc-warning)', bg: 'rgba(217,164,65,0.12)',  border: 'rgba(217,164,65,0.2)'  },
  'Off Today':   { text: 'var(--pc-fg-3)',    bg: 'rgba(150,150,140,0.08)', border: 'rgba(150,150,140,0.14)'},
};

const FALLBACK = { text: 'var(--pc-fg-3)', bg: 'rgba(150,150,140,0.08)', border: 'rgba(150,150,140,0.14)' };

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
