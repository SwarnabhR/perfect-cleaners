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
 * Groups live cleaningSessions by society+tower, summing totalCars/
 * completedCars/openCars across every session in the group — the
 * tower-level analog of resolveTodaysSocieties above. Callers pass sessions
 * already scoped to the right audience *and* the right day-bucket (a
 * worker's `workerIds`-filtered sessions for one bucket, or the admin
 * board's full session list for one bucket) — this only handles the tower
 * grouping/aggregation, not any date filtering, so a caller merging sessions
 * across different days would blend an overdue count into a today count.
 */
export function resolveTowerGroups(sessions: TowerSession[]): TowerGroupSummary[] {
  const groups = new Map<string, TowerGroupSummary>();

  for (const s of sessions) {
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

export type CarDueBucket = 'overdue' | 'today' | 'tomorrow' | 'later';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Which relative-day bucket a session's scheduledDate falls into. Unbounded
 * in both directions — a worker must be able to see (and, for an emergency
 * early clean, act on) every not-done car regardless of how far overdue or
 * how far out it's scheduled, not just a same-week window.
 */
export function getSessionDayBucket(scheduledDate: Date, now: Date = new Date()): CarDueBucket {
  const diffDays = Math.round((startOfDay(scheduledDate).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return 'later';
}

export interface WorkerTodoCar {
  sessionId: string;
  societyId: string;
  societyName: string;
  tower: string;
  scheduledDate: Date;
  dueBucket: CarDueBucket;
  customerId: string;
  customerName: string;
  customerPhone: string;
  unitNumber: string;
  parkingNumber: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number;
  status: CleaningSessionCar['status'];
}

type TodoSession = Pick<
  CleaningSessionEnhanced,
  'societyId' | 'societyName' | 'tower' | 'scheduledDate' | 'status' | 'cars'
> & { id: string };

/**
 * Flattens a worker's assigned sessions into per-car to-do rows spanning
 * every not-done car: Overdue (any earlier not-done session, no matter how
 * many days back) / Today / Tomorrow / Later (any future scheduled session —
 * a worker can still tap one early for an emergency clean) — the multi-day
 * view getCarUrgency below deliberately doesn't attempt (see its docstring).
 * Without this, a session that missed its date just silently dropped off
 * anything scoped to "today", which is the dashboard bug this exists to fix.
 */
export function resolveWorkerTodoCars(sessions: TodoSession[], now: Date = new Date()): WorkerTodoCar[] {
  const rows: WorkerTodoCar[] = [];
  for (const s of sessions) {
    if (s.status === 'done' || s.status === 'missed') continue;
    const d = toJsDate(s.scheduledDate);
    if (!d) continue;
    const dueBucket = getSessionDayBucket(d, now);
    if (!s.societyId || !s.tower) continue;

    for (const c of s.cars ?? []) {
      if (c.status !== 'pending' && c.status !== 'in_progress') continue;
      // Admin-toggled "not available today" (Live Cleaning board) — excluded
      // the same as a 'skipped' status would be, so it doesn't sit on a
      // worker's to-do list as actionable when it isn't.
      if (c.unavailable) continue;
      rows.push({
        sessionId:     s.id,
        societyId:     s.societyId,
        societyName:   s.societyName ?? s.societyId,
        tower:         s.tower,
        scheduledDate: d,
        dueBucket,
        customerId:    c.customerId,
        customerName:  c.customerName ?? '',
        customerPhone: c.customerPhone ?? '',
        unitNumber:    c.unitNumber ?? '',
        parkingNumber: c.parkingNumber ?? '',
        carPlate:      c.carPlate,
        carMake:       c.carMake,
        carModel:      c.carModel,
        preferredTime: c.preferredTime,
        status:        c.status,
      });
    }
  }
  return rows;
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
