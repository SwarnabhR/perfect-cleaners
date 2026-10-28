import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-server-auth';
import { resyncUpcomingSessions, removeCustomerFromScheduledSessions } from '@/lib/resync-sessions';

// Reconciles a customer's cars[] into any cleaningSessions doc already
// generated for their tower — generate-sessions only builds cars[] once, at
// creation time, and never revisits an existing 'scheduled' session. Since the
// rolling 2-week window is normally always fully populated, a customer who
// goes 'active' via admin approval (or whose address/vehicles were just edited
// on /customer-enrollments) would otherwise stay invisible or stale on every
// worker's live car list until the window naturally reaches a not-yet-generated
// date, up to ~2 weeks out.
//
// When `previous` is given (an admin moved the enrollment to another
// tower/society), the customer's rows are also stripped from that origin
// tower's future sessions — the destination resync can't reach them.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'), ['operations']);

    const { recordId, societyId, tower, customerId, previous } = await req.json() as {
      recordId?: string; societyId?: string; tower?: string; customerId?: string;
      previous?: { societyId?: string; tower?: string };
    };
    if (!recordId || !societyId || !tower) {
      return NextResponse.json({ error: 'recordId, societyId and tower are required.' }, { status: 400 });
    }

    if (previous?.societyId && previous.tower) {
      if (!customerId) {
        return NextResponse.json({ error: 'customerId is required when previous is set.' }, { status: 400 });
      }
      await removeCustomerFromScheduledSessions(customerId, previous.societyId, previous.tower);
    }

    await resyncUpcomingSessions(recordId, societyId, tower);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resync failed.';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? toErrMsg(error, 'Resync failed.') : message }, { status });
  }
}
