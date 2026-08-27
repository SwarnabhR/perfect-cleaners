'use client';

import Icon from './Icon';

// Shared "find the car in front of me" search box — used by the admin Live
// Cleaning board and the worker dashboard so both read and behave the same.
// Matching itself lives in buildCarSearchMatcher (@pc/firebase).
export default function CarSearchInput({
  value,
  onChange,
  label,
  placeholder = 'Flat, tower, parking level (B1, B2, G), car number…',
  hint,
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          htmlFor="car-search"
          style={{
            fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
          borderRadius: 8, padding: '0 12px', boxSizing: 'border-box',
        }}
      >
        <Icon name="search" size={15} color="var(--pc-fg-3)" />
        <input
          id="car-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 0, height: 44,
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--pc-fg)', fontFamily: 'var(--pc-sans)', fontSize: 14,
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            title="Clear search"
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 6,
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <Icon name="x" size={15} color="var(--pc-fg-3)" />
          </button>
        )}
      </div>
      {hint && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '6px 0 0' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
