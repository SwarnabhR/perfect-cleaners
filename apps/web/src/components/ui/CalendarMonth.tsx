'use client';

import Icon from '@/components/ui/Icon';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface CalendarMonthProps {
  month: Date;                                   // any date within the visible month
  onMonthChange: (d: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  renderBadge?: (date: Date) => React.ReactNode;  // dot/count decoration per cell
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Building the grid as flat cell data (rather than nested week arrays) keeps
// the render loop a single .map() — no index bookkeeping for row breaks.
function buildCells(month: Date): { date: Date; inMonth: boolean }[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(date.getDate() + i);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

export default function CalendarMonth({ month, onMonthChange, selectedDate, onSelectDate, renderBadge }: CalendarMonthProps) {
  const today = new Date();
  const cells = buildCells(month);

  return (
    <div style={{ background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 14, padding: 14 }}>
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="Previous month"
          style={{ display: 'flex', padding: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="chevron-left" size={16} color="var(--pc-fg-3)" />
        </button>
        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)' }}>
          {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Next month"
          style={{ display: 'flex', padding: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="chevron-right" size={16} color="var(--pc-fg-3)" />
        </button>
      </div>

      {/* Weekday header row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '4px 0', fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--pc-fg-4)', textTransform: 'uppercase' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map(({ date, inMonth }, i) => {
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(date)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, aspectRatio: '1', borderRadius: 8,
                background: isSelected ? 'var(--pc-sage)' : 'transparent',
                border: isToday && !isSelected ? '1px solid var(--pc-line-strong)' : '1px solid transparent',
                cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{
                fontFamily: 'var(--pc-sans)', fontSize: 12.5,
                color: isSelected ? 'var(--pc-sage-ink)' : inMonth ? 'var(--pc-fg)' : 'var(--pc-fg-4)',
                fontWeight: isToday ? 700 : 400,
              }}>
                {date.getDate()}
              </span>
              {renderBadge && (
                <span style={{ minHeight: 6, display: 'flex', alignItems: 'center' }}>
                  {renderBadge(date)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
