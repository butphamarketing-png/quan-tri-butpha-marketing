import { Router } from "express";
import { db, fanpagesTable, customersTable } from "@workspace/db";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router = Router();

router.get("/fanpages", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(fanpagesTable.pageName, `%${search}%`), ilike(fanpagesTable.pageUrl, `%${search}%`)));
    if (status) conditions.push(eq(fanpagesTable.status, status));
    if (customerId) conditions.push(eq(fanpagesTable.customerId, customerId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: fanpagesTable.id, customerId: fanpagesTable.customerId, customerName: customersTable.name,
        pageName: fanpagesTable.pageName, pageUrl: fanpagesTable.pageUrl, pageId: fanpagesTable.pageId,
        category: fanpagesTable.category, followers: fanpagesTable.followers, status: fanpagesTable.status,
        createdAt: fanpagesTable.createdAt, updatedAt: fanpagesTable.updatedAt,
      }).from(fanpagesTable).leftJoin(customersTable, eq(fanpagesTable.customerId, customersTable.id))
        .where(where).orderBy(fanpagesTable.createdAt).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(fanpagesTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/fanpages", async (req, res) => {
  try {
    const { customerId, pageName, pageUrl, pageId, category, followers, status } = req.body;
    if (!customerId || !pageName || !pageUrl) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(fanpagesTable).values({ customerId, pageName, pageUrl, pageId, category, followers, status: status || "active" }).returning();
    return res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/fanpages/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: fanpagesTable.id, customerId: fanpagesTable.customerId, customerName: customersTable.name,
      pageName: fanpagesTable.pageName, pageUrl: fanpagesTable.pageUrl, pageId: fanpagesTable.pageId,
      category: fanpagesTable.category, followers: fanpagesTable.followers, status: fanpagesTable.status,
      createdAt: fanpagesTable.createdAt, updatedAt: fanpagesTable.updatedAt,
    }).from(fanpagesTable).leftJoin(customersTable, eq(fanpagesTable.customerId, customersTable.id))
      .where(eq(fanpagesTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json(row);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/fanpages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, pageName, pageUrl, pageId, category, followers, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (pageName !== undefined) upd.pageName = pageName;
    if (pageUrl !== undefined) upd.pageUrl = pageUrl;
    if (pageId !== undefined) upd.pageId = pageId;
    if (category !== undefined) upd.category = category;
    if (followers !== undefined) upd.followers = followers;
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(fanpagesTable).set(upd).where(eq(fanpagesTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/fanpages/:id", async (req, res) => {
  try {
    await db.delete(fanpagesTable).where(eq(fanpagesTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
