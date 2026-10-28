// Every automated task that must heartbeat into the `cronHealth` collection
// (written by runMonitoredCron). The System Health page renders one card per
// entry; the dashboard and Operations page roll them up into an issue count.
//
// CRON_TASK_MAX_AGE_MINUTES is the longest gap we tolerate between successful
// runs. It lives here (not in cron-monitor.ts, which is server-only) so the
// watchdog and every client view agree on what "stale" means — previously the
// System Health page called any last-succeeded task "healthy" no matter how
// old that success was, so two jobs stale for months still read Healthy.
export const CRON_TASKS = [
  'generate-sessions',
  'start-sessions',
  'weekly-reminders',
  'payment-reminders',
  'monthly-billing',
  'process-cleaning-logs',
  'cleanup-sessions',
  'reset-earnings',
] as const;

export type CronTaskName = typeof CRON_TASKS[number];

export const CRON_TASK_MAX_AGE_MINUTES: Record<CronTaskName, number> = {
  'generate-sessions':     8 * 24 * 60,
  'start-sessions':        15,
  'weekly-reminders':      8 * 24 * 60,
  'payment-reminders':     38 * 24 * 60,
  'monthly-billing':       35 * 24 * 60,
  'process-cleaning-logs': 15,
  'cleanup-sessions':      26 * 60,
  'reset-earnings':        26 * 60,
};

export interface CronHealthLike {
  lastRunStatus?: string;
  lastRunAt?: { toDate?: () => Date } | null;
  lastSuccessAt?: { toDate?: () => Date } | null;
}

export type CronHealthState = 'healthy' | 'failed' | 'stale' | 'never';

/**
 * The single classification used by the System Health page, Operations and the
 * dashboard. Deliberately age-aware: a task whose last recorded run succeeded
 * two months ago is "stale", not "healthy" — which is exactly the false-green
 * the external scheduler's silent 401s produced.
 *
 *  - never    no run ever recorded (job not registered with the scheduler)
 *  - failed   the most recent run reported failure
 *  - stale    a success exists, but older than the task's expected interval
 *  - healthy  success within the expected interval
 */
export function cronHealthState(
  task: CronTaskName,
  health: CronHealthLike | undefined,
  now: number = Date.now(),
): CronHealthState {
  if (!health?.lastRunAt) return 'never';
  if (health.lastRunStatus !== 'success') return 'failed';
  const lastSuccess = health.lastSuccessAt?.toDate?.();
  if (!lastSuccess) return 'never';
  const age = now - lastSuccess.getTime();
  return age <= CRON_TASK_MAX_AGE_MINUTES[task] * 60_000 ? 'healthy' : 'stale';
}

/** Human-readable expected interval, e.g. "15 min", "26 h", "8 days". */
export function formatCronInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h`;
  const days = Math.round(minutes / (24 * 60));
  return `${days} day${days === 1 ? '' : 's'}`;
}
