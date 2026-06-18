import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { sendSMSViaTwilio, normalizePhoneNumber } from '@/lib/twilio';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

type NotificationType = 'approval' | 'car_cleaned' | 'weekly_reminder' | 'payment_reminder';

interface NotificationPayload {
  type: NotificationType;
  recipientPhone: string;
  recipientName: string;
  data: Record<string, any>;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendSMS(phone: string, message: string): Promise<SMSResponse> {
  try {
    // Normalize phone to E.164 format (+91XXXXXXXXXX)
    const normalizedPhone = normalizePhoneNumber(phone);

    // Send via Twilio
    const result = await sendSMSViaTwilio(normalizedPhone, message);

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (err: any) {
    console.error('[Notification] SMS send failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function buildMessage(type: NotificationType, data: Record<string, any>): Promise<string> {
  switch (type) {
    case 'approval':
      return `✅ Approved! Your car will be cleaned every ${data.schedule} starting ${data.startDate}. -Perfect Cleaners`;

    case 'car_cleaned':
      return `✨ Your car is clean! Ready for pickup. -Perfect Cleaners`;

    case 'weekly_reminder':
      return `🧹 Cleaning reminder: Your car will be cleaned ${data.schedule}. -Perfect Cleaners`;

    case 'payment_reminder':
      return `💳 Payment reminder: ₹${data.amount} due for this month's cleanings. Call us to pay. -Perfect Cleaners`;

    default:
      return 'Message from Perfect Cleaners';
  }
}

async function storeNotification(payload: NotificationPayload, smsResponse: SMSResponse) {
  try {
    const notificationId = `${payload.type}_${payload.data.customerId}_${Date.now()}`;
    await setDoc(doc(db, 'notifications', notificationId), {
      type: payload.type,
      recipientPhone: payload.recipientPhone,
      recipientName: payload.recipientName,
      data: payload.data,
      status: smsResponse.success ? 'sent' : 'failed',
      messageId: smsResponse.messageId,
      error: smsResponse.error,
      sentAt: serverTimestamp(),
    });
    return notificationId;
  } catch (err: any) {
    console.error('[Notification Store] Failed:', err.message);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: NotificationPayload = await req.json();

    // Validate required fields
    if (!body.type || !body.recipientPhone || !body.recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipientPhone, recipientName' },
        { status: 400 }
      );
    }

    // Build message
    const message = await buildMessage(body.type, body.data);

    // Send SMS
    const smsResponse = await sendSMS(body.recipientPhone, message);

    // Store notification in database
    const notificationId = await storeNotification(body, smsResponse);

    return NextResponse.json(
      {
        success: smsResponse.success,
        notificationId,
        message,
        messageId: smsResponse.messageId,
      },
      { status: smsResponse.success ? 200 : 206 }
    );
  } catch (err: any) {
    console.error('[/api/notification/send] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to send notification', details: err.message },
      { status: 500 }
    );
  }
}
