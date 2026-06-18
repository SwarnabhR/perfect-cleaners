/**
 * Twilio SMS Service
 * Sends SMS messages to customers
 *
 * Setup:
 * 1. Go to https://www.twilio.com
 * 2. Sign up (free trial: $15 credit)
 * 3. Get Account SID and Auth Token from dashboard
 * 4. Buy a phone number (costs ~$1/month)
 * 5. Add env vars:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER (format: +91XXXXXXXXXX)
 */

interface TwilioSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Twilio
 * @param toPhone - Recipient phone in E.164 format (e.g., +919876543210)
 * @param message - SMS message (max 160 chars for single SMS)
 */
export async function sendSMSViaTwilio(toPhone: string, message: string): Promise<TwilioSMSResponse> {
  try {
    // Validate environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      console.warn('[Twilio] Missing credentials. SMS not sent.');
      console.warn('  - TWILIO_ACCOUNT_SID:', accountSid ? '✓' : '✗');
      console.warn('  - TWILIO_AUTH_TOKEN:', authToken ? '✓' : '✗');
      console.warn('  - TWILIO_PHONE_NUMBER:', fromPhone ? '✓' : '✗');
      return {
        success: false,
        error: 'Twilio credentials not configured',
      };
    }

    // Validate phone number format
    if (!toPhone.startsWith('+')) {
      console.warn('[Twilio] Phone number must be in E.164 format (+91XXXXXXXXXX)');
      return {
        success: false,
        error: 'Invalid phone format',
      };
    }

    // Make API request to Twilio
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toPhone,
        From: fromPhone,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Twilio] API error:', response.status, error);
      return {
        success: false,
        error: `HTTP ${response.status}: ${error}`,
      };
    }

    const data = (await response.json()) as any;

    if (data.sid) {
      console.log('[Twilio] SMS sent successfully:', {
        to: toPhone,
        messageId: data.sid,
        status: data.status,
      });
      return {
        success: true,
        messageId: data.sid,
      };
    } else {
      console.error('[Twilio] Unexpected response:', data);
      return {
        success: false,
        error: 'Unexpected API response',
      };
    }
  } catch (err: any) {
    console.error('[Twilio] Exception:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Validate phone number format
 * Accepts: +919876543210, 919876543210, 9876543210
 * Returns: +919876543210 (E.164 format for India)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If already 12+ digits, assume it starts with country code
  if (digits.length >= 12) {
    return '+' + digits.slice(-12);
  }

  // If 10 digits (Indian mobile), add +91
  if (digits.length === 10) {
    return '+91' + digits;
  }

  // If already has country code, add +
  if (digits.length === 11 && digits.startsWith('91')) {
    return '+' + digits;
  }

  // Return as-is with + prefix
  return '+' + digits;
}

/**
 * Check SMS delivery status
 * (optional - for tracking delivered/failed messages)
 */
export async function checkSMSStatus(messageSid: string): Promise<string> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return 'unknown';
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return 'unknown';
    }

    const data = (await response.json()) as any;
    return data.status; // queued, sending, sent, failed, delivered, undelivered, receiving, received
  } catch (err) {
    return 'unknown';
  }
}
