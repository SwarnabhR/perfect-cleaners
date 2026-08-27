// When a cleaning session is due to begin, resolved once at creation time and
// stored on the session doc as `startAt`.
//
// This used to be worked out on every start-sessions run: that job read every
// candidate session, then looked up each tower's societyBillingConfig to find
// its cleaning time, then compared clock minutes in memory. Storing the answer
// lets the job ask Firestore a single question instead —
// `status == 'scheduled' AND startAt <= now` — which normally matches nothing
// and costs one read rather than one per candidate session.
//
// Deliberately free of any Firebase import so both the web app and the
// standalone backfill script can use it.

/** IST is UTC+5:30 and has no daylight saving, so a fixed offset is exact. */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Minutes past midnight from a schedule display string ("Mon, Wed, Fri · 9:00 AM").
 * Only covers configs saved before the structured cleaningTimeMinutes field
 * existed — prefer resolveTowerStartMinutes below, which tries this last.
 */
export function parseStartMinutes(schedule?: string): number | null {
  const match = schedule?.match(/(?:·|\|)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
    ?? schedule?.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/** Default when a tower has no usable cleaning time configured at all. */
export const DEFAULT_START_MINUTES = 7 * 60;

/**
 * A tower's start time in minutes past IST midnight. The structured field is
 * authoritative; the display-string parse is the legacy fallback; 7 AM is the
 * last resort so a misconfigured tower still starts rather than never starting.
 */
export function resolveTowerStartMinutes(
  config: { cleaningTimeMinutes?: number | null; cleaningSchedule?: string } | undefined,
): number {
  if (typeof config?.cleaningTimeMinutes === 'number') return config.cleaningTimeMinutes;
  return parseStartMinutes(config?.cleaningSchedule) ?? DEFAULT_START_MINUTES;
}

/**
 * The exact instant a session scheduled on `cleaningDate` should begin.
 *
 * `cleaningDate` carries an arbitrary time of day — generate-sessions builds it
 * as `new Date()` plus N days, so it reflects whatever time that run happened
 * at — and only its IST calendar date is meaningful. This reads that IST date,
 * then rebuilds the instant at `startMinutes` past IST midnight, so a session
 * generated at 5:31 AM UTC and one generated at 11 PM UTC for the same IST day
 * both resolve to the same start time.
 */
export function computeSessionStartAt(cleaningDate: Date, startMinutes: number): Date {
  return new Date(startOfIstDay(cleaningDate).getTime() + startMinutes * 60_000);
}

/**
 * Midnight IST of whichever IST day `d` falls in, as a UTC instant.
 *
 * start-sessions uses this as the LOWER bound of its query, and that bound is
 * load-bearing: `startAt <= now` alone stays true forever, so a session that
 * was never started on its day would be picked up and started days later. The
 * old in-memory logic only ever started a session on its own IST calendar day
 * (isDueToday) and left the rest for cleanup-sessions to mark missed. Since
 * startAt is always within its own IST day, `startAt >= startOfIstDay(now) AND
 * startAt <= now` reproduces that exactly.
 */
export function startOfIstDay(d: Date): Date {
  const asIst = new Date(d.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(asIst.getUTCFullYear(), asIst.getUTCMonth(), asIst.getUTCDate()) - IST_OFFSET_MS);
}
