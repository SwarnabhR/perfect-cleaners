import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

export type StaffRole = 'admin' | 'worker' | 'customer';

export const KEY_ROLE = '@pc/role';
export const KEY_ONBOARDING = '@pc/onboarding';

/** Resolves a signed-in user's role from Firestore: admins/{uid} wins over workers/{uid}. */
export async function resolveRole(uid: string): Promise<StaffRole> {
  const [adminSnap, workerSnap] = await Promise.all([
    firestore().collection('admins').doc(uid).get(),
    firestore().collection('workers').doc(uid).get(),
  ]);
  if (Boolean(adminSnap.exists)) return 'admin';
  if (Boolean(workerSnap.exists)) return 'worker';
  return 'customer';
}

export async function cacheRole(role: StaffRole) {
  await Promise.all([
    AsyncStorage.setItem(KEY_ROLE, role),
    role !== 'customer' ? AsyncStorage.setItem(KEY_ONBOARDING, 'done') : Promise.resolve(),
  ]);
}
