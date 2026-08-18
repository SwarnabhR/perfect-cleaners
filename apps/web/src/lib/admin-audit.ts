import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase/admin';

export async function writeAdminAudit(input: {
  adminId: string; action: string; entityType: string; entityId: string;
  summary: string; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null;
}) {
  await adminFirestore().collection('adminAuditLogs').add({
    ...input,
    before: input.before ?? null,
    after: input.after ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}
