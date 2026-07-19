import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase/admin';
import { sendSMSVia91msg, normalizePhoneFor91msg } from './91msg';

export type NotificationType = 'approval' | 'car_cleaned' | 'weekly_reminder' | 'payment_reminder' | 'cleaning_missed';

const MISSED_REASON_LABELS: Record<string, string> = {
  holiday: 'holiday',
  worker_unavailable: 'worker unavailable',
  other: 'unforeseen issue',
};

export interface NotificationPayload {
  type: NotificationType;
  recipientPhone: string;
  recipientName: string;
  data: Record<string, unknown>;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

function buildMessage(type: NotificationType, data: Record<string, unknown>): string {
  switch (type) {
    case 'approval':
      return `✅ Approved! Your car will be cleaned every ${data.schedule} starting ${data.startDate}. -Perfect Cleaners`;
    case 'car_cleaned':
      return `✨ Your car is clean! Ready for pickup. -Perfect Cleaners`;
    case 'weekly_reminder':
      return `🧹 Cleaning reminder: Your car will be cleaned ${data.schedule}. -Perfect Cleaners`;
    case 'payment_reminder':
      return `💳 Payment reminder: ₹${data.amount} due for this month's cleanings. Call us to pay. -Perfect Cleaners`;
    case 'cleaning_missed': {
      const reasonLabel = MISSED_REASON_LABELS[String(data.reason)] ?? 'an issue on our end';
      return `🧹 Sorry, your cleaning today was skipped (${reasonLabel}). Next cleaning: ${data.nextDateLabel}. -Perfect Cleaners`;
    }
    default:
      return 'Message from Perfect Cleaners';
  }
}

async function storeNotification(payload: NotificationPayload, message: string, smsResponse: SMSResponse): Promise<string> {
  const db = adminFirestore();
  const notificationId = `${payload.type}_${String(payload.data.customerId)}_${Date.now()}`;
  await db.collection('notifications').doc(notificationId).set({
    type:          payload.type,
    recipientPhone: payload.recipientPhone,
    recipientName:  payload.recipientName,
    data:           payload.data,
    message,
    status:         smsResponse.success ? 'sent' : 'failed',
    messageId:      smsResponse.messageId,
    error:          smsResponse.error,
    sentAt:         FieldValue.serverTimestamp(),
  });
  return notificationId;
}

/**
 * Shared by /api/notification/send (called from the browser for one-off
 * admin actions) and the reminder crons (called server-to-server) so both
 * paths build the exact same message copy and write the same history record.
 */
export async function sendAndStoreSMS(
  payload: NotificationPayload,
): Promise<{ success: boolean; notificationId: string; message: string; messageId?: string; error?: string }> {
  const message = buildMessage(payload.type, payload.data);

  let smsResponse: SMSResponse;
  try {
    smsResponse = await sendSMSVia91msg(normalizePhoneFor91msg(payload.recipientPhone), message);
  } catch (err: unknown) {
    smsResponse = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  const notificationId = await storeNotification(payload, message, smsResponse);

  return { success: smsResponse.success, notificationId, message, messageId: smsResponse.messageId, error: smsResponse.error };
}
