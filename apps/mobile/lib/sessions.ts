import type { CleaningSession } from '@pc/firebase';

export type LiveSession = CleaningSession & { id: string };
export type DayBucket = 'overdue' | 'today' | 'tomorrow' | 'later';

export const BUCKET_LABELS: Record<DayBucket, string> = {
  overdue: 'OVERDUE',
  today: 'TODAY',
  tomorrow: 'TOMORROW',
  later: 'UPCOMING',
};

export function toDate(raw: unknown): Date {
  const r = raw as { toDate?: () => Date } | Date | string | number | null | undefined;
  if (r && typeof (r as { toDate?: () => Date }).toDate === 'function') return (r as { toDate: () => Date }).toDate();
  return new Date(r as string | number | Date);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dayBucket(scheduled: Date, now = new Date()): DayBucket {
  const diff = Math.round((startOfDay(scheduled) - startOfDay(now)) / 86_400_000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'later';
}

export function formatClock(h: number): string {
  const hour = Math.floor(h);
  const mins = h % 1 ? '30' : '00';
  return `${hour % 12 || 12}:${mins} ${hour >= 12 ? 'PM' : 'AM'}`;
}

/** Earliest preferred time across a session's cars, or null when it has none. */
export function firstSlot(s: LiveSession): number | null {
  const times = (s.cars ?? []).map(c => c.preferredTime).filter(t => typeof t === 'number');
  return times.length ? Math.min(...times) : null;
}

export function dateLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
