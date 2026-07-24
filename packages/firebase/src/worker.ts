import type { Worker } from './types';

export interface WorkerSocietyAssignment {
  id: string;
  name: string;
}

/**
 * Societies a worker regularly services. Reads the new assignedSocietyIds[]
 * array, falling back to the legacy singular assignedSocietyId for docs
 * written before multi-society assignment existed.
 */
export function getAssignedSocieties(
  worker: Pick<Worker, 'assignedSocietyIds' | 'assignedSocietyNames' | 'assignedSocietyId' | 'assignedSocietyName'>,
): WorkerSocietyAssignment[] {
  if (worker.assignedSocietyIds?.length) {
    return worker.assignedSocietyIds.map((id, i) => ({
      id,
      name: worker.assignedSocietyNames?.[i] ?? id,
    }));
  }
  if (worker.assignedSocietyId) {
    return [{ id: worker.assignedSocietyId, name: worker.assignedSocietyName ?? worker.assignedSocietyId }];
  }
  return [];
}
