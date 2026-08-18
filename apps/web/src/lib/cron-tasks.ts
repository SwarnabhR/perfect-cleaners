// Every automated task that must heartbeat into the `cronHealth` collection
// (written by runMonitoredCron). The System Health page renders one card per
// entry; the dashboard rolls them up into a single healthy/attention line.
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
