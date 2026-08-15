import type { Worker } from './types';

export interface WorkerSocietyAssignment {
  id: string;
  name: string;
}

/**
 * Societies a worker regularly services. Reads the new assignedSocietyIds[]
 * array, falling back to the legacy singular assignedSocietyId for docs
 * written before multi-society assignment existed.
 */
export function getAssignedSocieties(
  worker: Pick<Worker, 'assignedSocietyIds' | 'assignedSocietyNames' | 'assignedSocietyId' | 'assignedSocietyName'>,
): WorkerSocietyAssignment[] {
  if (worker.assignedSocietyIds?.length) {
    return worker.assignedSocietyIds.map((id, i) => ({
      id,
      name: worker.assignedSocietyNames?.[i] ?? id,
    }));
  }
  if (worker.assignedSocietyId) {
    return [{ id: worker.assignedSocietyId, name: worker.assignedSocietyName ?? worker.assignedSocietyId }];
  }
  return [];
}

export interface SessionSocietyRef {
  societyId?: string;
  societyName?: string;
  scheduledDate?: { toDate?: () => Date } | Date | string | number | null;
}

function toJsDate(value: SessionSocietyRef['scheduledDate']): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string | number | Date);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Societies a worker is actually cleaning today, resolved from live
 * cleaningSessions.workerIds assignments — the real source of truth, which
 * nothing keeps in sync with the static assignedSocietyId(s) field above.
 * Every caller (dashboard, cleaning logs, ...) should resolve "which society
 * is this worker on" through here rather than reading getAssignedSocieties()
 * directly, so a worker whose only assignment is a live session (never had
 * assignedSocietyId set) doesn't see different answers on different pages.
 * Falls back to the static field only when nothing is live today (e.g.
 * between shifts, before the next session starts).
 */
export function resolveTodaysSocieties(
  worker: Pick<Worker, 'assignedSocietyIds' | 'assignedSocietyNames' | 'assignedSocietyId' | 'assignedSocietyName'>,
  sessions: SessionSocietyRef[],
): WorkerSocietyAssignment[] {
  const today = new Date();
  const map = new Map<string, string>();
  for (const s of sessions) {
    const d = toJsDate(s.scheduledDate);
    if (!d || !isSameDay(d, today)) continue;
    if (s.societyId) map.set(s.societyId, s.societyName ?? s.societyId);
  }
  if (map.size > 0) return [...map.entries()].map(([id, name]) => ({ id, name }));
  return getAssignedSocieties(worker);
}
