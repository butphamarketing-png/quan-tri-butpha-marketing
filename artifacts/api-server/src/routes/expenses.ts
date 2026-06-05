import { Router } from "express";
import { db, expensesTable, suppliersTable, servicesTable } from "@workspace/db";
import { eq, ilike, sql, and, gte, lte } from "drizzle-orm";
import { CreateExpenseBody, UpdateExpenseBody, GetExpenseParams, UpdateExpenseParams, DeleteExpenseParams, ListExpensesQueryParams } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

async function enrichExpense(expense: typeof expensesTable.$inferSelect) {
  let supplierName: string | null = null;
  if (expense.supplierId) {
    const [s] = await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, expense.supplierId)).limit(1);
    supplierName = s?.name ?? null;
  }
  let serviceName: string | null = null;
  if (expense.serviceId) {
    const [svc] = await db.select({ name: servicesTable.name }).from(servicesTable).where(eq(servicesTable.id, expense.serviceId)).limit(1);
    serviceName = svc?.name ?? null;
  }
  return {
    ...expense,
    amount: parseFloat(expense.amount),
    supplierName,
    serviceName,
  };
}

async function generateExpenseCode(): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(expensesTable);
  const count = result[0].count + 1;
  return `PC${String(count).padStart(4, "0")}`;
}

router.get("/expenses", async (req, res) => {
  const query = ListExpensesQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { supplierId, category, serviceId, fromDate, toDate, search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (supplierId) conditions.push(eq(expensesTable.supplierId, supplierId));
  if (category) conditions.push(eq(expensesTable.category, category));
  if (serviceId) conditions.push(eq(expensesTable.serviceId, serviceId));
  if (fromDate) conditions.push(gte(expensesTable.expenseDate, String(fromDate)));
  if (toDate) conditions.push(lte(expensesTable.expenseDate, String(toDate)));
  if (search) conditions.push(ilike(expensesTable.code, `%${search}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(expensesTable).where(where).limit(limit).offset(offset).orderBy(expensesTable.expenseDate),
    db.select({ count: sql<number>`count(*)::int` }).from(expensesTable).where(where),
  ]);

  const data = await Promise.all(rows.map(enrichExpense));
  return res.json({ data, total: totalResult[0].count, page, limit });
});

router.post("/expenses", async (req, res) => {
  const body = CreateExpenseBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const code = await generateExpenseCode();
  const [expense] = await db.insert(expensesTable).values({
    ...body.data,
    code,
    amount: String(body.data.amount),
  }).returning();
  const enriched = await enrichExpense(expense);
  await logAudit("expense", expense.id, "create", "Admin", null, enriched);
  return res.status(201).json(enriched);
});

router.get("/expenses/:id", async (req, res) => {
  const params = GetExpenseParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [expense] = await db.select().from(expensesTable).where(eq(expensesTable.id, params.data.id)).limit(1);
  if (!expense) return res.status(404).json({ error: "Not found" });
  return res.json(await enrichExpense(expense));
});

router.patch("/expenses/:id", async (req, res) => {
  const params = UpdateExpenseParams.safeParse(req.params);
  const body = UpdateExpenseBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid data" });

  const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, params.data.id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.amount !== undefined) updateData.amount = String(body.data.amount);

  const [updated] = await db.update(expensesTable).set(updateData).where(eq(expensesTable.id, params.data.id)).returning();
  const enriched = await enrichExpense(updated);
  await logAudit("expense", updated.id, "update", "Admin", await enrichExpense(existing), enriched);
  return res.json(enriched);
});

router.delete("/expenses/:id", async (req, res) => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, params.data.id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });

  await db.delete(expensesTable).where(eq(expensesTable.id, params.data.id));
  await logAudit("expense", params.data.id, "delete", "Admin", existing, null);
  return res.status(204).send();
});

export default router;
