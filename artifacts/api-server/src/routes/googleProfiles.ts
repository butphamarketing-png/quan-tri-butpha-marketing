import { Router } from "express";
import { db, googleProfilesTable, customersTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";

const router = Router();

router.get("/google-profiles", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(ilike(googleProfilesTable.businessName, `%${search}%`));
    if (customerId) conditions.push(eq(googleProfilesTable.customerId, customerId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: googleProfilesTable.id, customerId: googleProfilesTable.customerId, customerName: customersTable.name,
        businessName: googleProfilesTable.businessName, mapLink: googleProfilesTable.mapLink,
        category: googleProfilesTable.category, reviewCount: googleProfilesTable.reviewCount,
        rating: googleProfilesTable.rating, status: googleProfilesTable.status,
        createdAt: googleProfilesTable.createdAt, updatedAt: googleProfilesTable.updatedAt,
      }).from(googleProfilesTable).leftJoin(customersTable, eq(googleProfilesTable.customerId, customersTable.id))
        .where(where).orderBy(googleProfilesTable.createdAt).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(googleProfilesTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({ ...r, rating: r.rating ? Number(r.rating) : null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/google-profiles", async (req, res) => {
  try {
    const { customerId, businessName, mapLink, category, reviewCount, rating, status } = req.body;
    if (!customerId || !businessName) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(googleProfilesTable).values({
      customerId, businessName, mapLink, category, reviewCount,
      rating: rating ? String(rating) : undefined, status: status || "active",
    }).returning();
    return res.status(201).json({ ...created, rating: created.rating ? Number(created.rating) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/google-profiles/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: googleProfilesTable.id, customerId: googleProfilesTable.customerId, customerName: customersTable.name,
      businessName: googleProfilesTable.businessName, mapLink: googleProfilesTable.mapLink,
      category: googleProfilesTable.category, reviewCount: googleProfilesTable.reviewCount,
      rating: googleProfilesTable.rating, status: googleProfilesTable.status,
      createdAt: googleProfilesTable.createdAt, updatedAt: googleProfilesTable.updatedAt,
    }).from(googleProfilesTable).leftJoin(customersTable, eq(googleProfilesTable.customerId, customersTable.id))
      .where(eq(googleProfilesTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, rating: row.rating ? Number(row.rating) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/google-profiles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, businessName, mapLink, category, reviewCount, rating, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (businessName !== undefined) upd.businessName = businessName;
    if (mapLink !== undefined) upd.mapLink = mapLink;
    if (category !== undefined) upd.category = category;
    if (reviewCount !== undefined) upd.reviewCount = reviewCount;
    if (rating !== undefined) upd.rating = String(rating);
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(googleProfilesTable).set(upd).where(eq(googleProfilesTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, rating: updated.rating ? Number(updated.rating) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/google-profiles/:id", async (req, res) => {
  try {
    await db.delete(googleProfilesTable).where(eq(googleProfilesTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
