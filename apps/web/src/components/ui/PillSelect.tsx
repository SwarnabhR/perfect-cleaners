'use client';

interface PillSelectProps {
  options:   string[];
  value:     string;
  onChange:  (val: string) => void;
  /** Render as a scrollable single row instead of wrapping grid */
  scrollRow?: boolean;
}

export default function PillSelect({ options, value, onChange, scrollRow }: PillSelectProps) {
  return (
    <div style={{
      display:    scrollRow ? 'flex' : 'flex',
      flexWrap:   scrollRow ? 'nowrap' : 'wrap',
      gap:        'var(--pc-space-2)',
      overflowX:  scrollRow ? 'auto' : 'visible',
      paddingBottom: scrollRow ? 2 : 0, // room for scroll indicator
    }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            style={{
              flexShrink:    0,
              padding:       'var(--pc-space-2) var(--pc-space-4)',
              borderRadius:  'var(--pc-radius-sm)',
              border:        `1px solid ${active ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
              background:    active ? 'var(--pc-sage-subtle)' : 'var(--pc-card)',
              color:         active ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg-2)',
              fontFamily:    'var(--pc-sans)',
              fontSize:      'var(--pc-text-sm)',
              letterSpacing: 'var(--pc-track-snug)',
              cursor:        'pointer',
              whiteSpace:    'nowrap',
              transition:    'border-color var(--pc-dur-fast) var(--pc-ease), background var(--pc-dur-fast) var(--pc-ease), color var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
