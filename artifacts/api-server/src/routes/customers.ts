import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";
import { CreateCustomerBody, UpdateCustomerBody, GetCustomerParams, UpdateCustomerParams, DeleteCustomerParams, ListCustomersQueryParams } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

router.get("/customers", async (req, res) => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions = search ? [ilike(customersTable.name, `%${search}%`)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db.select().from(customersTable).where(where).limit(limit).offset(offset).orderBy(customersTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(where),
  ]);

  return res.json({ data, total: totalResult[0].count, page, limit });
});

router.post("/customers", async (req, res) => {
  const body = CreateCustomerBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [customer] = await db.insert(customersTable).values(body.data).returning();
  await logAudit("customer", customer.id, "create", "Admin", null, customer);
  return res.status(201).json(customer);
});

router.get("/customers/:id", async (req, res) => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id)).limit(1);
  if (!customer.length) return res.status(404).json({ error: "Not found" });
  return res.json(customer[0]);
});

router.patch("/customers/:id", async (req, res) => {
  const params = UpdateCustomerParams.safeParse(req.params);
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid data" });

  const existing = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const [updated] = await db.update(customersTable).set(body.data).where(eq(customersTable.id, params.data.id)).returning();
  await logAudit("customer", updated.id, "update", "Admin", existing[0], updated);
  return res.json(updated);
});

router.delete("/customers/:id", async (req, res) => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  await db.delete(customersTable).where(eq(customersTable.id, params.data.id));
  await logAudit("customer", params.data.id, "delete", "Admin", existing[0], null);
  return res.status(204).send();
});

export default router;
