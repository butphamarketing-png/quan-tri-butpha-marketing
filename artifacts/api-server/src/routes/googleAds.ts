import { Router } from "express";
import { db, googleAdsTable, customersTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router = Router();

router.get("/google-ads", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (customerId) conditions.push(eq(googleAdsTable.customerId, customerId));
    if (status) conditions.push(eq(googleAdsTable.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: googleAdsTable.id, customerId: googleAdsTable.customerId, customerName: customersTable.name,
        campaignName: googleAdsTable.campaignName, budget: googleAdsTable.budget, spend: googleAdsTable.spend,
        leads: googleAdsTable.leads, impressions: googleAdsTable.impressions,
        phoneCalls: googleAdsTable.phoneCalls, directions: googleAdsTable.directions,
        status: googleAdsTable.status,
        createdAt: googleAdsTable.createdAt, updatedAt: googleAdsTable.updatedAt,
      }).from(googleAdsTable).leftJoin(customersTable, eq(googleAdsTable.customerId, customersTable.id))
        .where(where).orderBy(googleAdsTable.createdAt).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(googleAdsTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({ ...r, budget: Number(r.budget), spend: Number(r.spend) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/google-ads", async (req, res) => {
  try {
    const { customerId, campaignName, budget, spend, leads, impressions, phoneCalls, directions, status } = req.body;
    if (!customerId || !campaignName || budget === undefined) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(googleAdsTable).values({
      customerId, campaignName,
      budget: String(budget), spend: String(spend ?? 0),
      leads: leads ?? 0, impressions: impressions ?? 0,
      phoneCalls: phoneCalls ?? 0, directions: directions ?? 0,
      status: status || "active",
    }).returning();
    return res.status(201).json({ ...created, budget: Number(created.budget), spend: Number(created.spend) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/google-ads/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: googleAdsTable.id, customerId: googleAdsTable.customerId, customerName: customersTable.name,
      campaignName: googleAdsTable.campaignName, budget: googleAdsTable.budget, spend: googleAdsTable.spend,
      leads: googleAdsTable.leads, impressions: googleAdsTable.impressions,
      phoneCalls: googleAdsTable.phoneCalls, directions: googleAdsTable.directions,
      status: googleAdsTable.status,
      createdAt: googleAdsTable.createdAt, updatedAt: googleAdsTable.updatedAt,
    }).from(googleAdsTable).leftJoin(customersTable, eq(googleAdsTable.customerId, customersTable.id))
      .where(eq(googleAdsTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, budget: Number(row.budget), spend: Number(row.spend) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/google-ads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, campaignName, budget, spend, leads, impressions, phoneCalls, directions, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (campaignName !== undefined) upd.campaignName = campaignName;
    if (budget !== undefined) upd.budget = String(budget);
    if (spend !== undefined) upd.spend = String(spend);
    if (leads !== undefined) upd.leads = leads;
    if (impressions !== undefined) upd.impressions = impressions;
    if (phoneCalls !== undefined) upd.phoneCalls = phoneCalls;
    if (directions !== undefined) upd.directions = directions;
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(googleAdsTable).set(upd).where(eq(googleAdsTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, budget: Number(updated.budget), spend: Number(updated.spend) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/google-ads/:id", async (req, res) => {
  try {
    await db.delete(googleAdsTable).where(eq(googleAdsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
