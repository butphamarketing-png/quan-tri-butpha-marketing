import { Router } from "express";
import { db, fanpageServicesTable, customersTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";

const router = Router();

router.get("/fanpage-services", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (customerId) conditions.push(eq(fanpageServicesTable.customerId, customerId));
    if (status) conditions.push(eq(fanpageServicesTable.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: fanpageServicesTable.id, customerId: fanpageServicesTable.customerId, customerName: customersTable.name,
        packageName: fanpageServicesTable.packageName, postsPerMonth: fanpageServicesTable.postsPerMonth,
        reelsPerMonth: fanpageServicesTable.reelsPerMonth, monthlyFee: fanpageServicesTable.monthlyFee,
        startDate: fanpageServicesTable.startDate, endDate: fanpageServicesTable.endDate,
        status: fanpageServicesTable.status,
        createdAt: fanpageServicesTable.createdAt, updatedAt: fanpageServicesTable.updatedAt,
      }).from(fanpageServicesTable).leftJoin(customersTable, eq(fanpageServicesTable.customerId, customersTable.id))
        .where(where).orderBy(fanpageServicesTable.createdAt).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(fanpageServicesTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({ ...r, monthlyFee: r.monthlyFee ? Number(r.monthlyFee) : null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/fanpage-services", async (req, res) => {
  try {
    const { customerId, packageName, postsPerMonth, reelsPerMonth, monthlyFee, startDate, endDate, status } = req.body;
    if (!customerId || !packageName || !startDate || !endDate) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(fanpageServicesTable).values({
      customerId, packageName,
      postsPerMonth: postsPerMonth ?? 0,
      reelsPerMonth: reelsPerMonth ?? 0,
      monthlyFee: monthlyFee ? String(monthlyFee) : undefined,
      startDate, endDate, status: status || "active",
    }).returning();
    return res.status(201).json({ ...created, monthlyFee: created.monthlyFee ? Number(created.monthlyFee) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/fanpage-services/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: fanpageServicesTable.id, customerId: fanpageServicesTable.customerId, customerName: customersTable.name,
      packageName: fanpageServicesTable.packageName, postsPerMonth: fanpageServicesTable.postsPerMonth,
      reelsPerMonth: fanpageServicesTable.reelsPerMonth, monthlyFee: fanpageServicesTable.monthlyFee,
      startDate: fanpageServicesTable.startDate, endDate: fanpageServicesTable.endDate, status: fanpageServicesTable.status,
      createdAt: fanpageServicesTable.createdAt, updatedAt: fanpageServicesTable.updatedAt,
    }).from(fanpageServicesTable).leftJoin(customersTable, eq(fanpageServicesTable.customerId, customersTable.id))
      .where(eq(fanpageServicesTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, monthlyFee: row.monthlyFee ? Number(row.monthlyFee) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/fanpage-services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, packageName, postsPerMonth, reelsPerMonth, monthlyFee, startDate, endDate, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (packageName !== undefined) upd.packageName = packageName;
    if (postsPerMonth !== undefined) upd.postsPerMonth = postsPerMonth;
    if (reelsPerMonth !== undefined) upd.reelsPerMonth = reelsPerMonth;
    if (monthlyFee !== undefined) upd.monthlyFee = monthlyFee ? String(monthlyFee) : null;
    if (startDate !== undefined) upd.startDate = startDate;
    if (endDate !== undefined) upd.endDate = endDate;
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(fanpageServicesTable).set(upd).where(eq(fanpageServicesTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, monthlyFee: updated.monthlyFee ? Number(updated.monthlyFee) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/fanpage-services/:id", async (req, res) => {
  try {
    await db.delete(fanpageServicesTable).where(eq(fanpageServicesTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
