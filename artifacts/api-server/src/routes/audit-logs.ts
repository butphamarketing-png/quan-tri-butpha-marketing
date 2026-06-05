import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/audit-logs", async (req, res) => {
  const query = ListAuditLogsQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { entityType, entityId, action, fromDate, toDate, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (entityType) conditions.push(eq(auditLogsTable.entityType, entityType));
  if (entityId) conditions.push(eq(auditLogsTable.entityId, entityId));
  if (action) conditions.push(eq(auditLogsTable.action, action));
  if (fromDate) conditions.push(gte(sql`${auditLogsTable.createdAt}::date`, String(fromDate)));
  if (toDate) conditions.push(lte(sql`${auditLogsTable.createdAt}::date`, String(toDate)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db.select().from(auditLogsTable).where(where).limit(limit).offset(offset).orderBy(sql`${auditLogsTable.createdAt} desc`),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogsTable).where(where),
  ]);

  return res.json({ data, total: totalResult[0].count, page, limit });
});

export default router;
