/**
 * 91msg SMS Service
 * Indian SMS gateway - cheaper & better delivery than Twilio for India
 *
 * Setup:
 * 1. Go to https://www.91msg.com
 * 2. Sign up and add credit (₹1 per SMS or bulk packages)
 * 3. Get API key from dashboard
 * 4. Add env vars:
 *    - NINEONE_MSG_API_KEY
 *    - NINEONE_MSG_SENDER_ID (e.g., "PCWASH")
 */

interface NineOneMsgResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via 91msg
 * @param toPhone - Recipient phone in format: 919876543210 (no +)
 * @param message - SMS message (max 160 chars for single SMS)
 */
export async function sendSMSVia91msg(toPhone: string, message: string): Promise<NineOneMsgResponse> {
  try {
    // Validate environment variables
    const apiKey = process.env.NINEONE_MSG_API_KEY;
    const senderId = process.env.NINEONE_MSG_SENDER_ID;

    if (!apiKey || !senderId) {
      console.warn('[91msg] Missing credentials. SMS not sent.');
      console.warn('  - NINEONE_MSG_API_KEY:', apiKey ? '✓' : '✗');
      console.warn('  - NINEONE_MSG_SENDER_ID:', senderId ? '✓' : '✗');
      return {
        success: false,
        error: '91msg credentials not configured',
      };
    }

    // Normalize phone: remove +, keep only digits
    const cleanPhone = toPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      console.warn('[91msg] Phone number too short:', toPhone);
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    // Ensure it's 12 digits (country code + 10 digits for India)
    const finalPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone.slice(-12);

    // 91msg API endpoint
    const url = 'https://api.91msg.com/send/';

    const params = new URLSearchParams({
      apikey: apiKey,
      mobile: finalPhone,
      message: message,
      senderid: senderId,
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET', // 91msg uses GET requests
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();

    // 91msg returns plain text, not JSON
    // Success: "1" or "ok" or message ID
    // Failure: "0" or error message
    if (response.ok && (text === '1' || text === 'ok' || /^\d+$/.test(text))) {
      console.log('[91msg] SMS sent successfully:', {
        to: finalPhone,
        messageId: text,
        message: message.substring(0, 50),
      });
      return {
        success: true,
        messageId: text,
      };
    } else {
      console.error('[91msg] API error:', response.status, text);
      return {
        success: false,
        error: `HTTP ${response.status}: ${text}`,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[91msg] Exception:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Validate phone number format
 * Accepts: +919876543210, 919876543210, 9876543210
 * Returns: 919876543210 (format for 91msg)
 */
export function normalizePhoneFor91msg(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If 10 digits (Indian mobile), add country code
  if (digits.length === 10) {
    return '91' + digits;
  }

  // If already has country code, ensure it's 12 digits
  if (digits.length >= 12) {
    return digits.slice(-12);
  }

  // Return as-is
  return '91' + digits;
}

/**
 * Check account balance (if 91msg supports it)
 * Most SMS gateways don't expose balance via API, so this is optional
 */
export async function check91msgBalance(): Promise<number | null> {
  try {
    const apiKey = process.env.NINEONE_MSG_API_KEY;
    if (!apiKey) return null;

    // This is a placeholder - 91msg may not have a balance API
    // Check their docs for availability
    return null;
  } catch {
    return null;
  }
}
