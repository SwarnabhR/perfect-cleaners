import type { CleaningSessionCar, CleaningSessionEnhanced, Worker } from './types';

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

export interface TowerGroupSummary {
  key: string;            // `${societyId}::${tower}` — unique join key
  societyId: string;
  societyName: string;
  tower: string;
  sessionIds: string[];
  totalCars: number;
  completedCars: number;
  openCars: number;       // totalCars - completedCars
}

type TowerSession = Pick<
  CleaningSessionEnhanced,
  'societyId' | 'societyName' | 'tower' | 'totalCars' | 'completedCars' | 'scheduledDate'
> & { id: string };

/**
 * Towers a worker (or, unfiltered, the whole ops board) is actually cleaning
 * today, resolved from live cleaningSessions grouped by society+tower — the
 * tower-level analog of resolveTodaysSocieties above. Callers pass sessions
 * already scoped to the right audience (a worker's `workerIds`-filtered
 * sessions, or every session for the admin board); this only handles the
 * same-day filter and the tower grouping/aggregation on top.
 */
export function resolveTodaysTowerGroups(sessions: TowerSession[]): TowerGroupSummary[] {
  const today = new Date();
  const groups = new Map<string, TowerGroupSummary>();

  for (const s of sessions) {
    const d = toJsDate(s.scheduledDate);
    if (!d || !isSameDay(d, today)) continue;
    if (!s.societyId || !s.tower) continue;

    const key = `${s.societyId}::${s.tower}`;
    const existing = groups.get(key);
    const totalCars = s.totalCars ?? 0;
    const completedCars = s.completedCars ?? 0;

    if (existing) {
      existing.sessionIds.push(s.id);
      existing.totalCars += totalCars;
      existing.completedCars += completedCars;
      existing.openCars = existing.totalCars - existing.completedCars;
    } else {
      groups.set(key, {
        key,
        societyId: s.societyId,
        societyName: s.societyName ?? s.societyId,
        tower: s.tower,
        sessionIds: [s.id],
        totalCars,
        completedCars,
        openCars: totalCars - completedCars,
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.tower.localeCompare(b.tower, 'en', { numeric: true }));
}

export type CarUrgency = 'done' | 'overdue' | 'due-soon' | 'later';

/**
 * Reinterprets the reference design's multi-day "overdue/due today/tomorrow"
 * chips within a single-day scope: how a car's preferredTime slot compares to
 * the current time, since sessions only carry one scheduledDate for all their
 * cars (no per-car due date exists in the data model).
 */
export function getCarUrgency(
  preferredTime: number,
  status: CleaningSessionCar['status'],
  now: Date = new Date(),
): CarUrgency {
  if (status === 'done') return 'done';
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const diff = nowHour - preferredTime;
  if (diff > 0) return 'overdue';
  if (diff > -1) return 'due-soon';
  return 'later';
}
