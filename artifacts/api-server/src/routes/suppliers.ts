import { Router } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";
import { CreateSupplierBody, UpdateSupplierBody, UpdateSupplierParams, DeleteSupplierParams, ListSuppliersQueryParams } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

router.get("/suppliers", async (req, res) => {
  const query = ListSuppliersQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions = search ? [ilike(suppliersTable.name, `%${search}%`)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db.select().from(suppliersTable).where(where).limit(limit).offset(offset).orderBy(suppliersTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(suppliersTable).where(where),
  ]);

  return res.json({ data, total: totalResult[0].count, page, limit });
});

router.post("/suppliers", async (req, res) => {
  const body = CreateSupplierBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [supplier] = await db.insert(suppliersTable).values(body.data).returning();
  await logAudit("supplier", supplier.id, "create", "Admin", null, supplier);
  return res.status(201).json(supplier);
});

router.patch("/suppliers/:id", async (req, res) => {
  const params = UpdateSupplierParams.safeParse(req.params);
  const body = UpdateSupplierBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid data" });

  const existing = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const [updated] = await db.update(suppliersTable).set(body.data).where(eq(suppliersTable.id, params.data.id)).returning();
  await logAudit("supplier", updated.id, "update", "Admin", existing[0], updated);
  return res.json(updated);
});

router.delete("/suppliers/:id", async (req, res) => {
  const params = DeleteSupplierParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  await db.delete(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  await logAudit("supplier", params.data.id, "delete", "Admin", existing[0], null);
  return res.status(204).send();
});

export default router;
