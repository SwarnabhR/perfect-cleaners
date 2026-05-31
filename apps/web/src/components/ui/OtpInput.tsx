'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface OtpInputProps {
  length?:   number;
  value:     string;
  onChange:  (value: string) => void;
  disabled?: boolean;
}

export default function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function focus(i: number) {
    refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  }

  function handleChange(i: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next  = value.split('').concat(Array(length).fill('')).slice(0, length);
    next[i]     = digit;
    onChange(next.join(''));
    if (digit) focus(i + 1);
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.split('').concat(Array(length).fill('')).slice(0, length);
      if (next[i]) {
        next[i] = '';
        onChange(next.join(''));
      } else {
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); focus(i + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    onChange(digits.padEnd(length, '').slice(0, length));
    focus(Math.min(digits.length, length - 1));
  }

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={e  => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={e => e.target.select()}
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: 80,
            height: 64,
            textAlign: 'center',
            fontFamily: 'var(--pc-serif)',
            fontSize: 28,
            color: 'var(--pc-fg)',
            background: d ? 'var(--pc-card-hi)' : 'var(--pc-card)',
            border: `1px solid ${d ? 'var(--pc-line-strong)' : 'var(--pc-line)'}`,
            borderRadius: 'var(--pc-radius-md)',
            outline: 'none',
            caretColor: 'transparent',
            transition: 'border-color 0.15s ease, background 0.15s ease',
          }}
        />
      ))}
    </div>
  );
}
