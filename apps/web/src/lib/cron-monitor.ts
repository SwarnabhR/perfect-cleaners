import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from './firebase/admin';
import { normalizePhoneForMsg91, sendSMSViaMsg91 } from './msg91-sms';

export const CRON_TASKS = {
  'generate-sessions':    { maxAgeMinutes: 8 * 24 * 60 },
  'weekly-reminders':     { maxAgeMinutes: 8 * 24 * 60 },
  'payment-reminders':    { maxAgeMinutes: 38 * 24 * 60 },
  'monthly-billing':      { maxAgeMinutes: 35 * 24 * 60 },
  'process-cleaning-logs': { maxAgeMinutes: 15 },
  'cleanup-sessions':     { maxAgeMinutes: 26 * 60 },
  'reset-earnings':       { maxAgeMinutes: 26 * 60 },
} as const;

export type CronTaskName = keyof typeof CRON_TASKS;

export function isAuthorizedCron(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

async function sendOperationsAlert(task: CronTaskName, reason: string, signature: string) {
  const db = adminFirestore();
  const alertRef = db.collection('notifications').doc(`cron_alert_${task}_${signature}`);
  const phone = process.env.OPERATIONS_ALERT_PHONE;
  let sms: { success: boolean; messageId?: string; error?: string } = {
    success: false,
    error: 'OPERATIONS_ALERT_PHONE not configured',
  };

  if (phone) {
    sms = await sendSMSViaMsg91(
      normalizePhoneForMsg91(phone),
      `ALERT: Perfect Cleaners cron ${task} ${reason}. Check Admin > Notifications.`,
    );
  }

  await alertRef.set({
    type: 'cron_alert', recipientName: 'Operations', recipientPhone: phone ?? '',
    message: `Cron ${task}: ${reason}`,
    status: sms.success ? 'sent' : 'failed', messageId: sms.messageId,
    error: sms.error, sentAt: FieldValue.serverTimestamp(), task, signature,
  });
}

async function recordRun(task: CronTaskName, status: 'success' | 'failed', detail?: string) {
  const db = adminFirestore();
  const ref = db.collection('cronHealth').doc(task);
  const now = new Date();
  await ref.set({
    task, lastRunAt: now, lastRunStatus: status, lastRunDetail: detail ?? null,
    ...(status === 'success' ? { lastSuccessAt: now, lastFailureAt: null, lastFailureDetail: null } : { lastFailureAt: now, lastFailureDetail: detail ?? 'Unknown failure' }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (status === 'failed') {
    await sendOperationsAlert(task, 'failed', String(now.getTime()));
  }
}

/** Records every authorised run. A non-2xx response or a response reporting
 * `errors > 0` is treated as a failed operational run. */
export async function runMonitoredCron(
  req: NextRequest,
  task: CronTaskName,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const response = await handler();
    let detail: string | undefined;
    try {
      const body = await response.clone().json() as { error?: string; errors?: number };
      if (body.error) detail = body.error;
      else if (typeof body.errors === 'number' && body.errors > 0) detail = `${body.errors} item error(s)`;
    } catch { /* non-JSON responses are still monitored by status */ }
    await recordRun(task, response.ok && !detail ? 'success' : 'failed', detail ?? `HTTP ${response.status}`);
    return response;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    await recordRun(task, 'failed', detail);
    return NextResponse.json({ error: 'Cron execution failed.' }, { status: 500 });
  }
}

/** Called by the watchdog schedule. Sends one SMS per missed-success incident,
 * while storing the current status in Firestore for the admin console. */
export async function checkCronHealth(): Promise<{ task: CronTaskName; healthy: boolean; reason?: string }[]> {
  const db = adminFirestore();
  const now = Date.now();
  const results: { task: CronTaskName; healthy: boolean; reason?: string }[] = [];

  for (const [task, config] of Object.entries(CRON_TASKS) as [CronTaskName, typeof CRON_TASKS[CronTaskName]][]) {
    const ref = db.collection('cronHealth').doc(task);
    const snap = await ref.get();
    const data = snap.data();
    const lastSuccess = data?.lastSuccessAt?.toDate?.() as Date | undefined;
    const age = lastSuccess ? now - lastSuccess.getTime() : Number.POSITIVE_INFINITY;
    const healthy = age <= config.maxAgeMinutes * 60_000;
    const reason = healthy ? undefined : lastSuccess ? `has not succeeded for over ${config.maxAgeMinutes} minutes` : 'has never reported a successful run';
    results.push({ task, healthy, reason });

    if (!healthy) {
      const signature = String(lastSuccess?.getTime() ?? 'never');
      if (data?.lastMissedAlertSignature !== signature) {
        await ref.set({ lastMissedAlertSignature: signature, lastMissedAlertAt: new Date(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        await sendOperationsAlert(task, reason!, `missed_${signature}`);
      }
    }
  }
  return results;
}
