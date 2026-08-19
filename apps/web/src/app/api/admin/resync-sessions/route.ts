import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-server-auth';
import { resyncUpcomingSessions } from '@/lib/resync-sessions';

// Backfills a customer's car into any cleaningSessions doc already generated
// for their tower — generate-sessions only builds cars[] once, at creation
// time, and never revisits an existing 'scheduled' session. Since the
// rolling 2-week window is normally always fully populated, a customer who
// goes 'active' via admin approval would otherwise be invisible to every
// worker's live car list until the window naturally reaches a
// not-yet-generated date, up to ~2 weeks out. Called once from
// pending-approvals' handleApprove right after activating the record.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'), ['operations']);

    const { recordId, societyId, tower } = await req.json() as {
      recordId?: string; societyId?: string; tower?: string;
    };
    if (!recordId || !societyId || !tower) {
      return NextResponse.json({ error: 'recordId, societyId and tower are required.' }, { status: 400 });
    }

    await resyncUpcomingSessions(recordId, societyId, tower);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resync failed.';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? toErrMsg(error, 'Resync failed.') : message }, { status });
  }
}
