import { Router } from "express";
import { db, debtsTable, customersTable, contractsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router = Router();

router.get("/debts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (customerId) conditions.push(eq(debtsTable.customerId, customerId));
    if (status) conditions.push(eq(debtsTable.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: debtsTable.id, customerId: debtsTable.customerId, customerName: customersTable.name,
        contractId: debtsTable.contractId,
        totalAmount: debtsTable.totalAmount, paidAmount: debtsTable.paidAmount,
        dueDate: debtsTable.dueDate, status: debtsTable.status,
        createdAt: debtsTable.createdAt, updatedAt: debtsTable.updatedAt,
      }).from(debtsTable)
        .leftJoin(customersTable, eq(debtsTable.customerId, customersTable.id))
        .where(where).orderBy(debtsTable.dueDate).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(debtsTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({ ...r, totalAmount: Number(r.totalAmount), paidAmount: Number(r.paidAmount) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/debts", async (req, res) => {
  try {
    const { customerId, contractId, totalAmount, paidAmount, dueDate, status } = req.body;
    if (!customerId || totalAmount === undefined || !dueDate) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(debtsTable).values({
      customerId, contractId: contractId || null,
      totalAmount: String(totalAmount), paidAmount: String(paidAmount ?? 0),
      dueDate, status: status || "pending",
    }).returning();
    return res.status(201).json({ ...created, totalAmount: Number(created.totalAmount), paidAmount: Number(created.paidAmount) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/debts/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: debtsTable.id, customerId: debtsTable.customerId, customerName: customersTable.name,
      contractId: debtsTable.contractId,
      totalAmount: debtsTable.totalAmount, paidAmount: debtsTable.paidAmount,
      dueDate: debtsTable.dueDate, status: debtsTable.status,
      createdAt: debtsTable.createdAt, updatedAt: debtsTable.updatedAt,
    }).from(debtsTable)
      .leftJoin(customersTable, eq(debtsTable.customerId, customersTable.id))
      .where(eq(debtsTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, totalAmount: Number(row.totalAmount), paidAmount: Number(row.paidAmount) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/debts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, contractId, totalAmount, paidAmount, dueDate, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (contractId !== undefined) upd.contractId = contractId;
    if (totalAmount !== undefined) upd.totalAmount = String(totalAmount);
    if (paidAmount !== undefined) upd.paidAmount = String(paidAmount);
    if (dueDate !== undefined) upd.dueDate = dueDate;
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(debtsTable).set(upd).where(eq(debtsTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, totalAmount: Number(updated.totalAmount), paidAmount: Number(updated.paidAmount) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/debts/:id", async (req, res) => {
  try {
    await db.delete(debtsTable).where(eq(debtsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
