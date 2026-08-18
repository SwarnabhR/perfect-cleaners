import { NextResponse } from 'next/server';

// Retired 2026-08-18. This was the last writer of legacy single-worker
// sessions (workerId instead of workerIds) and nothing in web or mobile
// calls it — sessions are created exclusively by the generate-sessions cron.
// Safe to delete this file entirely.
export async function POST() {
  return NextResponse.json(
    { error: 'Gone. Sessions are created automatically by the generate-sessions cron.' },
    { status: 410 },
  );
}
