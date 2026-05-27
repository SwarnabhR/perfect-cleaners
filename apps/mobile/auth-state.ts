/**
 * Module-level store for the @react-native-firebase ConfirmationResult.
 * The object cannot be serialised through navigation params, so it lives here.
 * Cleared on each new OTP request and on sign-out.
 */
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

let _pending: FirebaseAuthTypes.ConfirmationResult | null = null;

export function setPendingConfirmation(c: FirebaseAuthTypes.ConfirmationResult | null) {
  _pending = c;
}

export function getPendingConfirmation(): FirebaseAuthTypes.ConfirmationResult | null {
  return _pending;
}
