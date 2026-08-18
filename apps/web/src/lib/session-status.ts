import type { CleaningSessionStatus } from '@pc/firebase';

// Owner- and worker-facing names for cleaning-session statuses. The Firestore
// values (scheduled/inprogress/done/missed) are internal — every surface that
// shows a session status to a person renders through this map so the wording
// can never drift between pages.
export const SESSION_STATUS_LABELS: Record<CleaningSessionStatus, string> = {
  scheduled:  'Upcoming',
  inprogress: 'Active',
  done:       'Completed',
  missed:     'Missed',
};

export function sessionStatusLabel(status: string): string {
  return SESSION_STATUS_LABELS[status as CleaningSessionStatus] ?? status;
}
