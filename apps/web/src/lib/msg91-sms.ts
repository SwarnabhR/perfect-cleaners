/**
 * MSG91 transactional SMS
 *
 * Reuses the account already configured for OTP auth (MSG91_AUTH_KEY in
 * /api/auth/verify-otp) instead of standing up a second SMS provider —
 * replaces the never-configured 91msg.com integration this project
 * previously called out to, whose NINEONE_MSG_API_KEY / NINEONE_MSG_SENDER_ID
 * were never set, so every society notification (approvals, car-cleaned,
 * reminders) was silently recorded as failed.
 *
 * Endpoint + params mirror the working draft already used for booking
 * confirmations in /api/payment/verify/route.ts.
 */

interface Msg91Response {
  success: boolean;
  messageId?: string;
  error?: string;
}

const SENDER_ID = 'PCLNRS';

/**
 * Send SMS via MSG91's sendhttp API
 * @param toPhone - Recipient phone in format: 919876543210 (no +)
 * @param message - SMS message (max 160 chars for single SMS)
 */
export async function sendSMSViaMsg91(toPhone: string, message: string): Promise<Msg91Response> {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      console.warn('[MSG91] Missing MSG91_AUTH_KEY. SMS not sent.');
      return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const cleanPhone = toPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      console.warn('[MSG91] Phone number too short:', toPhone);
      return { success: false, error: 'Invalid phone number' };
    }
    const finalPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone.slice(-12);

    const url = new URL('https://api.msg91.com/api/sendhttp.php');
    url.searchParams.set('authkey', authKey);
    url.searchParams.set('mobiles', finalPhone);
    url.searchParams.set('message', message);
    url.searchParams.set('route',   '4');
    url.searchParams.set('sender',  SENDER_ID);
    url.searchParams.set('country', '91');
    url.searchParams.set('unicode', '0');

    const response = await fetch(url.toString());
    const text = (await response.text()).trim();

    // MSG91's sendhttp API returns a plain-text message ID on success;
    // failures come back as a human-readable error string.
    if (response.ok && text && !/error/i.test(text)) {
      console.log('[MSG91] SMS sent successfully:', { to: finalPhone, messageId: text, message: message.substring(0, 50) });
      return { success: true, messageId: text };
    } else {
      console.error('[MSG91] API error:', response.status, text);
      return { success: false, error: text || `HTTP ${response.status}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[MSG91] Exception:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Validate phone number format
 * Accepts: +919876543210, 919876543210, 9876543210
 * Returns: 919876543210 (format for MSG91)
 */
export function normalizePhoneForMsg91(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length >= 12) return digits.slice(-12);
  return '91' + digits;
}
