'use client';

import { useEffect, useRef, useState } from 'react';

interface SlideToConfirmProps {
  label:       string;
  onConfirm:   () => void;
  disabled?:   boolean;
  loading?:    boolean;
  variant?:    'warm' | 'sage';
}

const THRESHOLD = 0.82; // fraction of track width needed to confirm

export default function SlideToConfirm({
  label, onConfirm, disabled = false, loading = false, variant = 'warm',
}: SlideToConfirmProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [progress,  setProgress]  = useState(0); // 0–1
  const [confirmed, setConfirmed] = useState(false);

  const trackRef  = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Reset when disabled/loading clears
  useEffect(() => {
    if (!loading && !disabled) { setConfirmed(false); setProgress(0); }
  }, [loading, disabled]);

  function getClientX(e: MouseEvent | TouchEvent): number {
    return 'touches' in e ? e.touches[0].clientX : e.clientX;
  }

  function startDrag(clientX: number) {
    if (disabled || loading || confirmed) return;
    startXRef.current = clientX;
    setDragging(true);
  }

  function moveDrag(clientX: number) {
    if (!dragging || !trackRef.current) return;
    const thumbW   = 52;
    const trackW   = trackRef.current.offsetWidth - thumbW;
    const delta    = clientX - startXRef.current;
    const pct      = Math.min(1, Math.max(0, delta / trackW));
    setProgress(pct);

    if (pct >= THRESHOLD) {
      setDragging(false);
      setConfirmed(true);
      setProgress(1);
      onConfirm();
    }
  }

  function endDrag() {
    if (!dragging) return;
    setDragging(false);
    if (progress < THRESHOLD) setProgress(0);
  }

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => moveDrag(getClientX(e));
    const onUp   = () => endDrag();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, progress]);

  const bg      = variant === 'sage' ? 'var(--pc-sage)'    : 'var(--pc-warm)';
  const inkCol  = variant === 'sage' ? 'var(--pc-sage-ink)': 'var(--pc-ink)';
  const trackBg = variant === 'sage'
    ? 'color-mix(in srgb, var(--pc-sage) 18%, transparent)'
    : 'color-mix(in srgb, var(--pc-warm) 14%, transparent)';
  const trackBorder = variant === 'sage'
    ? 'rgba(74,94,68,0.3)'
    : 'color-mix(in srgb, var(--pc-warm) 35%, transparent)';

  // ── Desktop: plain button ──────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <button
        type="button"
        onClick={() => !disabled && !loading && onConfirm()}
        disabled={disabled || loading}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 999,
          background: (disabled || loading) ? 'var(--pc-warm-3)' : bg,
          color: inkCol, border: 'none',
          fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
          opacity: (disabled || loading) ? 0.6 : 1,
          transition: 'opacity 0.15s ease, background 0.15s ease',
        }}
      >
        {loading ? 'Processing…' : label}
      </button>
    );
  }

  // ── Mobile: swipe track ────────────────────────────────────────────────────
  const thumbLeft = `calc(4px + ${progress} * (100% - 60px))`;

  return (
    <div
      ref={trackRef}
      role="button"
      aria-label={label}
      style={{
        position: 'relative',
        height: 56, borderRadius: 999,
        background: confirmed ? bg : trackBg,
        border: `1px solid ${trackBorder}`,
        overflow: 'hidden',
        opacity: (disabled || loading) ? 0.5 : 1,
        cursor: (disabled || loading) ? 'not-allowed' : 'default',
        userSelect: 'none', WebkitUserSelect: 'none',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Fill bar */}
      <div style={{
        position: 'absolute', inset: 0, right: 'auto',
        width: `calc(4px + ${progress} * (100% - 60px) + 26px)`,
        background: bg, opacity: 0.25,
        transition: dragging ? 'none' : 'width 0.3s ease',
        borderRadius: 999,
      }} />

      {/* Label */}
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: confirmed ? inkCol : variant === 'sage' ? 'var(--pc-sage-hi)' : 'var(--pc-warm)',
        opacity: confirmed ? 1 : Math.max(0, 1 - progress * 2.5),
        transition: 'opacity 0.15s ease',
        pointerEvents: 'none',
      }}>
        {loading ? 'Processing…' : confirmed ? '✓ Done' : label}
      </span>

      {/* Thumb */}
      {!confirmed && (
        <div
          onMouseDown={e => startDrag(e.clientX)}
          onTouchStart={e => startDrag(e.touches[0].clientX)}
          style={{
            position: 'absolute',
            top: 4, left: thumbLeft,
            width: 48, height: 48,
            borderRadius: '50%',
            background: (disabled || loading) ? 'var(--pc-card-hi)' : bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (disabled || loading) ? 'not-allowed' : 'grab',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            transition: dragging ? 'none' : 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            flexShrink: 0,
            touchAction: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={inkCol} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </div>
      )}
    </div>
  );
}
