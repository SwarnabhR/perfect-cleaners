type NotificationType = 'approval' | 'car_cleaned' | 'weekly_reminder' | 'payment_reminder';

interface NotificationPayload {
  type: NotificationType;
  recipientPhone: string;
  recipientName: string;
  data: Record<string, unknown>;
}

async function buildHeaders(): Promise<HeadersInit> {
  try {
    const { auth } = await import('@pc/firebase');
    const token = await auth.currentUser?.getIdToken();
    if (token) return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  } catch {
    // Not authenticated — request will be rejected by the API route
  }
  return { 'Content-Type': 'application/json' };
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/notification/send', {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[Notification] HTTP error:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (err: unknown) {
    console.error('[Notification] Send failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Send approval notification
 * "✅ Approved! Your car will be cleaned every Mon/Wed/Fri starting [date]"
 */
export async function notifyApproval(
  customerPhone: string,
  customerName: string,
  societyName: string,
  tower: string,
  schedule: string,
  startDate: string
) {
  return sendNotification({
    type: 'approval',
    recipientPhone: customerPhone,
    recipientName: customerName,
    data: {
      customerId: customerPhone,
      societyName,
      tower,
      schedule,
      startDate,
    },
  });
}

/**
 * Send car cleaned notification
 * "✨ Your car is clean! Ready for pickup"
 */
export async function notifyCarCleaned(
  customerPhone: string,
  customerName: string,
  carPlate: string,
  societyName: string,
  tower: string
) {
  return sendNotification({
    type: 'car_cleaned',
    recipientPhone: customerPhone,
    recipientName: customerName,
    data: {
      customerId: customerPhone,
      carPlate,
      societyName,
      tower,
    },
  });
}

/**
 * Send weekly reminder notification
 * "🧹 Cleaning reminder: Your car will be cleaned Mon/Wed/Fri"
 */
export async function notifyWeeklyReminder(
  customerPhone: string,
  customerName: string,
  schedule: string,
  societyName: string
) {
  return sendNotification({
    type: 'weekly_reminder',
    recipientPhone: customerPhone,
    recipientName: customerName,
    data: {
      customerId: customerPhone,
      schedule,
      societyName,
    },
  });
}

/**
 * Send payment reminder notification
 * "💳 Payment reminder: ₹500 due for this month's cleanings"
 */
export async function notifyPaymentReminder(
  customerPhone: string,
  customerName: string,
  amount: number,
  societyName: string
) {
  return sendNotification({
    type: 'payment_reminder',
    recipientPhone: customerPhone,
    recipientName: customerName,
    data: {
      customerId: customerPhone,
      amount,
      societyName,
    },
  });
}
