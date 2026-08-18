import 'server-only';
import { adminAuth, adminFirestore } from './firebase/admin';

export type AdminCapability = 'owner' | 'operations' | 'billing' | 'support' | 'analyst';

export async function requireAdmin(token: string | null, allowed: AdminCapability[]) {
  if (!token) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(token.replace(/^Bearer\s+/i, ''));
  const snap = await adminFirestore().collection('admins').doc(decoded.uid).get();
  if (!snap.exists) throw new Error('FORBIDDEN');
  const role = (snap.data()?.role as AdminCapability | undefined) ?? 'owner';
  if (role !== 'owner' && !allowed.includes(role)) throw new Error('FORBIDDEN');
  return { uid: decoded.uid, role };
}
