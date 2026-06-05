import { Router } from "express";
import { db, domainsTable, customersTable } from "@workspace/db";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router = Router();

const daysUntilExpiry = (expireDate: string) => {
  const now = new Date();
  const exp = new Date(expireDate);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

router.get("/domains", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(domainsTable.domainName, `%${search}%`), ilike(domainsTable.provider, `%${search}%`)));
    if (status) conditions.push(eq(domainsTable.status, status));
    if (customerId) conditions.push(eq(domainsTable.customerId, customerId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: domainsTable.id, customerId: domainsTable.customerId, customerName: customersTable.name,
        domainName: domainsTable.domainName, provider: domainsTable.provider,
        registerDate: domainsTable.registerDate, expireDate: domainsTable.expireDate,
        buyPrice: domainsTable.buyPrice, sellPrice: domainsTable.sellPrice,
        status: domainsTable.status, note: domainsTable.note,
        createdAt: domainsTable.createdAt, updatedAt: domainsTable.updatedAt,
      }).from(domainsTable).leftJoin(customersTable, eq(domainsTable.customerId, customersTable.id))
        .where(where).orderBy(domainsTable.expireDate).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(domainsTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({
        ...r,
        buyPrice: r.buyPrice ? Number(r.buyPrice) : null,
        sellPrice: r.sellPrice ? Number(r.sellPrice) : null,
        daysUntilExpiry: daysUntilExpiry(r.expireDate),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/domains", async (req, res) => {
  try {
    const { customerId, domainName, provider, registerDate, expireDate, buyPrice, sellPrice, status, note } = req.body;
    if (!customerId || !domainName || !provider || !registerDate || !expireDate)
      return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(domainsTable).values({
      customerId, domainName, provider, registerDate, expireDate,
      buyPrice: buyPrice ? String(buyPrice) : undefined,
      sellPrice: sellPrice ? String(sellPrice) : undefined,
      status: status || "active", note,
    }).returning();
    return res.status(201).json({
      ...created,
      buyPrice: created.buyPrice ? Number(created.buyPrice) : null,
      sellPrice: created.sellPrice ? Number(created.sellPrice) : null,
      daysUntilExpiry: daysUntilExpiry(created.expireDate),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/domains/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: domainsTable.id, customerId: domainsTable.customerId, customerName: customersTable.name,
      domainName: domainsTable.domainName, provider: domainsTable.provider,
      registerDate: domainsTable.registerDate, expireDate: domainsTable.expireDate,
      buyPrice: domainsTable.buyPrice, sellPrice: domainsTable.sellPrice,
      status: domainsTable.status, note: domainsTable.note,
      createdAt: domainsTable.createdAt, updatedAt: domainsTable.updatedAt,
    }).from(domainsTable).leftJoin(customersTable, eq(domainsTable.customerId, customersTable.id))
      .where(eq(domainsTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, buyPrice: row.buyPrice ? Number(row.buyPrice) : null, sellPrice: row.sellPrice ? Number(row.sellPrice) : null, daysUntilExpiry: daysUntilExpiry(row.expireDate) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/domains/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, domainName, provider, registerDate, expireDate, buyPrice, sellPrice, status, note } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (domainName !== undefined) upd.domainName = domainName;
    if (provider !== undefined) upd.provider = provider;
    if (registerDate !== undefined) upd.registerDate = registerDate;
    if (expireDate !== undefined) upd.expireDate = expireDate;
    if (buyPrice !== undefined) upd.buyPrice = buyPrice ? String(buyPrice) : null;
    if (sellPrice !== undefined) upd.sellPrice = sellPrice ? String(sellPrice) : null;
    if (status !== undefined) upd.status = status;
    if (note !== undefined) upd.note = note;
    const [updated] = await db.update(domainsTable).set(upd).where(eq(domainsTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, buyPrice: updated.buyPrice ? Number(updated.buyPrice) : null, sellPrice: updated.sellPrice ? Number(updated.sellPrice) : null, daysUntilExpiry: daysUntilExpiry(updated.expireDate) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/domains/:id", async (req, res) => {
  try {
    await db.delete(domainsTable).where(eq(domainsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
