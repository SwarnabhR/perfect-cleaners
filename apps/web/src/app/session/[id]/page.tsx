import { adminFirestore } from '@/lib/firebase/admin';
import SessionClient from './SessionClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;

  try {
    const db   = adminFirestore();
    const snap = await db.collection('cleaningSessions').doc(id).get();

    if (!snap.exists) {
      return <NotFound message="Session not found." />;
    }

    const data    = snap.data()!;
    const session = {
      id:            snap.id,
      societyId:     data.societyId   as string,
      societyName:   data.societyName as string,
      tower:         (data.tower      as string | undefined) ?? null,
      workerId:      data.workerId    as string,
      workerName:    data.workerName  as string,
      scheduledDate: data.scheduledDate?.toDate?.()?.toISOString() ?? null,
      status:        data.status      as string,
      totalCars:     data.totalCars   as number,
      completedCars: data.completedCars as number,
      startedAt:     data.startedAt?.toDate?.()?.toISOString()   ?? null,
      completedAt:   data.completedAt?.toDate?.()?.toISOString() ?? null,
    };

    return <SessionClient initialSession={session} sessionId={id} />;
  } catch {
    return <NotFound message="Unable to load session." />;
  }
}

function NotFound({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans, sans-serif)', color: 'rgba(255,255,255,0.5)', fontSize: 14,
    }}>
      {message}
    </div>
  );
}
