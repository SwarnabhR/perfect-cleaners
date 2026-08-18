import { NextRequest, NextResponse } from 'next/server';
import { checkCronHealth, isAuthorizedCron } from '@/lib/cron-monitor';

// Run every 15 minutes. This watchdog detects a missing external cron call,
// which individual task routes cannot observe on their own.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const tasks = await checkCronHealth();
  return NextResponse.json({ ok: tasks.every(t => t.healthy), tasks, checkedAt: new Date().toISOString() });
}
