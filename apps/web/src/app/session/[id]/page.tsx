import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { adminFirestore } from '@/lib/firebase/admin';
import SessionClient from './SessionClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const db   = adminFirestore();
    const snap = await db.collection('cleaningSessions').doc(id).get();
    if (!snap.exists) return { title: 'Session Not Found' };
    const data = snap.data()!;
    const name = [data.tower, data.societyName].filter(Boolean).join(' · ');
    return {
      title: `Cleaning Session — ${name}`,
      description: `Track the cleaning progress for ${name}.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: 'Cleaning Session' };
  }
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;

  try {
    const db   = adminFirestore();
    const snap = await db.collection('cleaningSessions').doc(id).get();

    if (!snap.exists) notFound();

    const data    = snap.data()!;
    const session = {
      id:            snap.id,
      societyId:     data.societyId   as string,
      societyName:   data.societyName as string,
      tower:         (data.tower      as string | undefined) ?? null,
      // Sessions are now written with multi-worker arrays (workerIds/workerNames);
      // fall back to the legacy singular fields for any older docs.
      workerName:    (data.workerNames as string[] | undefined)?.join(', ')
                        ?? (data.workerName as string | undefined)
                        ?? '',
      scheduledDate: data.scheduledDate?.toDate?.()?.toISOString() ?? null,
      status:        data.status      as string,
      totalCars:     data.totalCars   as number,
      completedCars: data.completedCars as number,
      startedAt:     data.startedAt?.toDate?.()?.toISOString()   ?? null,
      completedAt:   data.completedAt?.toDate?.()?.toISOString() ?? null,
      cars: ((data.cars as Record<string, unknown>[] | undefined) ?? []).map(c => ({
        customerId:    c.customerId    as string,
        customerName:  (c.customerName as string | undefined) ?? '',
        unitNumber:    (c.unitNumber   as string | undefined) ?? '',
        carPlate:      (c.carPlate     as string | undefined) ?? '',
        carMake:       (c.carMake      as string | undefined) ?? '',
        carModel:      (c.carModel     as string | undefined) ?? '',
        preferredTime: (c.preferredTime as number | undefined) ?? null,
        status:        (c.status       as string | undefined) ?? 'pending',
      })),
    };

    return <SessionClient initialSession={session} sessionId={id} />;
  } catch {
    notFound();
  }
}
