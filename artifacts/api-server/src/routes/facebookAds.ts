import { Router } from "express";
import { db, facebookAdsTable, customersTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router = Router();

router.get("/facebook-ads", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (customerId) conditions.push(eq(facebookAdsTable.customerId, customerId));
    if (status) conditions.push(eq(facebookAdsTable.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: facebookAdsTable.id, customerId: facebookAdsTable.customerId, customerName: customersTable.name,
        adAccount: facebookAdsTable.adAccount, monthlyBudget: facebookAdsTable.monthlyBudget,
        spend: facebookAdsTable.spend, leads: facebookAdsTable.leads, status: facebookAdsTable.status,
        createdAt: facebookAdsTable.createdAt, updatedAt: facebookAdsTable.updatedAt,
      }).from(facebookAdsTable).leftJoin(customersTable, eq(facebookAdsTable.customerId, customersTable.id))
        .where(where).orderBy(facebookAdsTable.createdAt).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(facebookAdsTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({ ...r, monthlyBudget: Number(r.monthlyBudget), spend: Number(r.spend) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/facebook-ads", async (req, res) => {
  try {
    const { customerId, adAccount, monthlyBudget, spend, leads, status } = req.body;
    if (!customerId || monthlyBudget === undefined) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(facebookAdsTable).values({
      customerId, adAccount, monthlyBudget: String(monthlyBudget),
      spend: String(spend ?? 0), leads: leads ?? 0, status: status || "active",
    }).returning();
    return res.status(201).json({ ...created, monthlyBudget: Number(created.monthlyBudget), spend: Number(created.spend) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/facebook-ads/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: facebookAdsTable.id, customerId: facebookAdsTable.customerId, customerName: customersTable.name,
      adAccount: facebookAdsTable.adAccount, monthlyBudget: facebookAdsTable.monthlyBudget,
      spend: facebookAdsTable.spend, leads: facebookAdsTable.leads, status: facebookAdsTable.status,
      createdAt: facebookAdsTable.createdAt, updatedAt: facebookAdsTable.updatedAt,
    }).from(facebookAdsTable).leftJoin(customersTable, eq(facebookAdsTable.customerId, customersTable.id))
      .where(eq(facebookAdsTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, monthlyBudget: Number(row.monthlyBudget), spend: Number(row.spend) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/facebook-ads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, adAccount, monthlyBudget, spend, leads, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (adAccount !== undefined) upd.adAccount = adAccount;
    if (monthlyBudget !== undefined) upd.monthlyBudget = String(monthlyBudget);
    if (spend !== undefined) upd.spend = String(spend);
    if (leads !== undefined) upd.leads = leads;
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(facebookAdsTable).set(upd).where(eq(facebookAdsTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, monthlyBudget: Number(updated.monthlyBudget), spend: Number(updated.spend) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/facebook-ads/:id", async (req, res) => {
  try {
    await db.delete(facebookAdsTable).where(eq(facebookAdsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
