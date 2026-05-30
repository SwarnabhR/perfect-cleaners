'use client';

import { useEffect, useRef, useState } from 'react';

interface CustomSelectProps {
  options:     string[];
  value:       string;
  onChange:    (val: string) => void;
  placeholder?: string;
  className?:  string;
  style?:      React.CSSProperties;
  error?:      boolean;
}

export default function CustomSelect({
  options, value, onChange, placeholder, className, style, error,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Keyboard nav inside the list
  function handleOptionKey(e: React.KeyboardEvent, opt: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(opt);
      setOpen(false);
    }
  }

  const selected = value || placeholder || options[0];

  return (
    <div ref={rootRef} style={{ position: 'relative', ...style }} className={className}>
      {/* Trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px',
          background: 'var(--pc-card)',
          border: `1px solid ${error ? 'var(--pc-danger)' : open ? 'rgba(91,111,82,0.65)' : 'var(--pc-line-strong)'}`,
          borderRadius: 'var(--pc-radius-sm)',
          boxShadow: open ? '0 0 0 3px rgba(91,111,82,0.09)' : 'none',
          cursor: 'pointer',
          transition: 'border-color var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
          outline: 'none',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-sm)',
          color: value ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {selected}
        </span>

        {/* Chevron */}
        <svg
          width="11" height="7" viewBox="0 0 11 7" fill="none"
          style={{
            flexShrink: 0, marginLeft: 10,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--pc-dur-fast) var(--pc-ease)',
          }}
        >
          <path d="M1 1l4.5 4.5L10 1" stroke="var(--pc-fg-3)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            zIndex: 40,
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line-strong)',
            borderRadius: 'var(--pc-radius-sm)',
            boxShadow: 'var(--pc-shadow-pop)',
            maxHeight: 220,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '4px 0',
            margin: 0,
            listStyle: 'none',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--pc-line-strong) transparent',
          }}
        >
          {options.map(opt => {
            const active = opt === value;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={active}
                tabIndex={0}
                onClick={() => { onChange(opt); setOpen(false); }}
                onKeyDown={e => handleOptionKey(e, opt)}
                style={{
                  padding: '10px 16px',
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-sm)',
                  color: active ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg)',
                  background: active ? 'var(--pc-sage-subtle)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background var(--pc-dur-fast) var(--pc-ease)',
                  outline: 'none',
                  userSelect: 'none',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--pc-card-hi)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
                onFocus={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--pc-card-hi)';
                }}
                onBlur={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {opt}
                {active && (
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path d="M1 5l4 4L12 1" stroke="var(--pc-sage-hi)"
                          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
