import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";
import { CreateServiceBody, UpdateServiceBody, UpdateServiceParams, DeleteServiceParams, ListServicesQueryParams } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

router.get("/services", async (req, res) => {
  const query = ListServicesQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions = search ? [ilike(servicesTable.name, `%${search}%`)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db.select().from(servicesTable).where(where).limit(limit).offset(offset).orderBy(servicesTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(servicesTable).where(where),
  ]);

  return res.json({ data, total: totalResult[0].count, page, limit });
});

router.post("/services", async (req, res) => {
  const body = CreateServiceBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [service] = await db.insert(servicesTable).values(body.data).returning();
  await logAudit("service", service.id, "create", "Admin", null, service);
  return res.status(201).json(service);
});

router.patch("/services/:id", async (req, res) => {
  const params = UpdateServiceParams.safeParse(req.params);
  const body = UpdateServiceBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid data" });

  const existing = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const [updated] = await db.update(servicesTable).set(body.data).where(eq(servicesTable.id, params.data.id)).returning();
  await logAudit("service", updated.id, "update", "Admin", existing[0], updated);
  return res.json(updated);
});

router.delete("/services/:id", async (req, res) => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
  await logAudit("service", params.data.id, "delete", "Admin", existing[0], null);
  return res.status(204).send();
});

export default router;
