import { db, auditLogsTable } from "@workspace/db";

export async function logAudit(
  entityType: string,
  entityId: number,
  action: string,
  performedBy: string,
  oldData: unknown,
  newData: unknown,
) {
  try {
    await db.insert(auditLogsTable).values({
      entityType,
      entityId,
      action,
      performedBy,
      oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
      newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
    });
  } catch {
    // Audit log failure should not break the main operation
  }
}
