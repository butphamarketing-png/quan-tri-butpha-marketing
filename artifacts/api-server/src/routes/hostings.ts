import { Router } from "express";
import { db, hostingsTable, customersTable } from "@workspace/db";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router = Router();

const daysUntilExpiry = (expireDate: string) => {
  const now = new Date();
  const exp = new Date(expireDate);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

router.get("/hostings", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(hostingsTable.hostingName, `%${search}%`), ilike(hostingsTable.provider, `%${search}%`)));
    if (status) conditions.push(eq(hostingsTable.status, status));
    if (customerId) conditions.push(eq(hostingsTable.customerId, customerId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: hostingsTable.id, customerId: hostingsTable.customerId, customerName: customersTable.name,
        hostingName: hostingsTable.hostingName, provider: hostingsTable.provider,
        package: hostingsTable.package, capacity: hostingsTable.capacity,
        registerDate: hostingsTable.registerDate, expireDate: hostingsTable.expireDate,
        buyPrice: hostingsTable.buyPrice, sellPrice: hostingsTable.sellPrice,
        status: hostingsTable.status, note: hostingsTable.note,
        createdAt: hostingsTable.createdAt, updatedAt: hostingsTable.updatedAt,
      }).from(hostingsTable).leftJoin(customersTable, eq(hostingsTable.customerId, customersTable.id))
        .where(where).orderBy(hostingsTable.expireDate).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(hostingsTable).where(where),
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

router.post("/hostings", async (req, res) => {
  try {
    const { customerId, hostingName, provider, package: pkg, capacity, registerDate, expireDate, buyPrice, sellPrice, status, note } = req.body;
    if (!customerId || !hostingName || !provider || !pkg || !registerDate || !expireDate)
      return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(hostingsTable).values({
      customerId, hostingName, provider, package: pkg, capacity,
      registerDate, expireDate,
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

router.get("/hostings/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: hostingsTable.id, customerId: hostingsTable.customerId, customerName: customersTable.name,
      hostingName: hostingsTable.hostingName, provider: hostingsTable.provider,
      package: hostingsTable.package, capacity: hostingsTable.capacity,
      registerDate: hostingsTable.registerDate, expireDate: hostingsTable.expireDate,
      buyPrice: hostingsTable.buyPrice, sellPrice: hostingsTable.sellPrice,
      status: hostingsTable.status, note: hostingsTable.note,
      createdAt: hostingsTable.createdAt, updatedAt: hostingsTable.updatedAt,
    }).from(hostingsTable).leftJoin(customersTable, eq(hostingsTable.customerId, customersTable.id))
      .where(eq(hostingsTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, buyPrice: row.buyPrice ? Number(row.buyPrice) : null, sellPrice: row.sellPrice ? Number(row.sellPrice) : null, daysUntilExpiry: daysUntilExpiry(row.expireDate) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/hostings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, hostingName, provider, package: pkg, capacity, registerDate, expireDate, buyPrice, sellPrice, status, note } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (customerId !== undefined) upd.customerId = customerId;
    if (hostingName !== undefined) upd.hostingName = hostingName;
    if (provider !== undefined) upd.provider = provider;
    if (pkg !== undefined) upd.package = pkg;
    if (capacity !== undefined) upd.capacity = capacity;
    if (registerDate !== undefined) upd.registerDate = registerDate;
    if (expireDate !== undefined) upd.expireDate = expireDate;
    if (buyPrice !== undefined) upd.buyPrice = buyPrice ? String(buyPrice) : null;
    if (sellPrice !== undefined) upd.sellPrice = sellPrice ? String(sellPrice) : null;
    if (status !== undefined) upd.status = status;
    if (note !== undefined) upd.note = note;
    const [updated] = await db.update(hostingsTable).set(upd).where(eq(hostingsTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, buyPrice: updated.buyPrice ? Number(updated.buyPrice) : null, sellPrice: updated.sellPrice ? Number(updated.sellPrice) : null, daysUntilExpiry: daysUntilExpiry(updated.expireDate) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/hostings/:id", async (req, res) => {
  try {
    await db.delete(hostingsTable).where(eq(hostingsTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
