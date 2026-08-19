// Turns customerSocietyRecords docs into the cars[] entries a cleaningSessions
// doc stores for one scheduled date. Previously this logic was hand-duplicated
// between the generate-sessions cron and the admin's manual session-create
// tool, which let their skip/reschedule/permanentTime handling silently drift
// apart — kept here as the single source of truth so both (and the
// customer-unavailability resync) stay in sync.

interface FirestoreTimestampLike {
  toDate: () => Date;
}

function toDateSafe(v: unknown): Date {
  const val = v as FirestoreTimestampLike | Date | string | number | undefined;
  if (val && typeof (val as FirestoreTimestampLike).toDate === 'function') {
    return (val as FirestoreTimestampLike).toDate();
  }
  return new Date(val as string | number | Date);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

import type { VehicleCategory } from './types';

export interface SocietyCarSourceCustomer {
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  unitNumber?: string;
  parkingNumber?: string;
  cars?: Array<{ plate?: string; make?: string; model?: string; category?: VehicleCategory }>;
  preferredCleaningDays?: number[];
  preferredCleaningTime?: number;
  skipDates?: unknown[];
  rescheduledSlots?: Array<{ date: unknown; toTime: number }>;
  permanentTime?: number;
}

export interface SessionCarDraft {
  customerId: string;
  customerName: string;
  customerPhone: string;
  unitNumber: string;
  parkingNumber: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  vehicleCategory: VehicleCategory;
  preferredTime: number;
  status: 'pending' | 'skipped';
}

/**
 * Turns one active customerSocietyRecords doc into its cleaningSessions car
 * entries for a given date — one per vehicle in cars[] (a resident with both
 * a car and a two-wheeler gets two separate checklist rows, since they're two
 * separate physical tasks) — or [] if the customer's preferred days exclude
 * that date entirely.
 */
export function buildSessionCarsForCustomer(
  customer: SocietyCarSourceCustomer,
  scheduledDate: Date,
): SessionCarDraft[] {
  const preferredDays = customer.preferredCleaningDays;
  if (preferredDays?.length && !preferredDays.includes(scheduledDate.getDay())) return [];
  const vehicles = customer.cars?.length ? customer.cars : [{}];

  const isSkipped = (customer.skipDates ?? []).some(d => isSameCalendarDay(toDateSafe(d), scheduledDate));
  const rescheduled = (customer.rescheduledSlots ?? []).find(s => isSameCalendarDay(toDateSafe(s.date), scheduledDate));
  const preferredTime = rescheduled
    ? rescheduled.toTime
    : (customer.permanentTime || customer.preferredCleaningTime || 9);

  return vehicles.map(v => ({
    customerId:      customer.customerId,
    customerName:    customer.customerName || '',
    customerPhone:   customer.customerPhone || '',
    unitNumber:      customer.unitNumber || '',
    parkingNumber:   customer.parkingNumber || '',
    carPlate:        v.plate || '',
    carMake:         v.make  || '',
    carModel:        v.model || '',
    vehicleCategory: v.category ?? 'car',
    ...(isSkipped
      ? { preferredTime: customer.preferredCleaningTime || 9, status: 'skipped' as const }
      : { preferredTime, status: 'pending' as const }),
  }));
}

export function buildSessionCars(
  customers: SocietyCarSourceCustomer[],
  scheduledDate: Date,
): SessionCarDraft[] {
  return customers.flatMap(c => buildSessionCarsForCustomer(c, scheduledDate));
}

/**
 * Deterministic cleaningSessions doc ID — same scheme the generate-sessions
 * cron and the admin's manual session-create tool both rely on, so a resync
 * can look a session up by ID instead of querying for it.
 */
export function sessionIdFor(societyId: string, tower: string, scheduledDate: Date, suffix?: string): string {
  const towerSlug = String(tower).trim().replace(/\s+/g, '-');
  const dateStr   = scheduledDate.toISOString().split('T')[0];
  return `${societyId}_${towerSlug}_${dateStr}${suffix ? `_${suffix}` : ''}`;
}
