import { Router } from "express";
import { db, websitesTable, customersTable, domainsTable, hostingsTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";

const router = Router();

router.get("/websites", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(ilike(websitesTable.websiteName, `%${search}%`));
    if (status) conditions.push(eq(websitesTable.status, status));
    if (customerId) conditions.push(eq(websitesTable.customerId, customerId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: websitesTable.id, customerId: websitesTable.customerId, customerName: customersTable.name,
        websiteName: websitesTable.websiteName, cms: websitesTable.cms, technology: websitesTable.technology,
        domainId: websitesTable.domainId, domainName: domainsTable.domainName,
        hostingId: websitesTable.hostingId, hostingName: hostingsTable.hostingName,
        startDate: websitesTable.startDate, deadline: websitesTable.deadline,
        deliveryDate: websitesTable.deliveryDate, contractValue: websitesTable.contractValue,
        adminUrl: websitesTable.adminUrl, status: websitesTable.status, note: websitesTable.note,
        createdAt: websitesTable.createdAt, updatedAt: websitesTable.updatedAt,
      }).from(websitesTable)
        .leftJoin(customersTable, eq(websitesTable.customerId, customersTable.id))
        .leftJoin(domainsTable, eq(websitesTable.domainId, domainsTable.id))
        .leftJoin(hostingsTable, eq(websitesTable.hostingId, hostingsTable.id))
        .where(where).orderBy(websitesTable.createdAt).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(websitesTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({
      data: data.map(r => ({ ...r, contractValue: r.contractValue ? Number(r.contractValue) : null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/websites", async (req, res) => {
  try {
    const { customerId, websiteName, cms, technology, domainId, hostingId, startDate, deadline, deliveryDate, contractValue, adminUrl, username, status, note } = req.body;
    if (!customerId || !websiteName || !cms) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(websitesTable).values({
      customerId, websiteName, cms, technology,
      domainId: domainId || null, hostingId: hostingId || null,
      startDate, deadline, deliveryDate,
      contractValue: contractValue ? String(contractValue) : undefined,
      adminUrl, username, status: status || "completed", note,
    }).returning();
    return res.status(201).json({ ...created, contractValue: created.contractValue ? Number(created.contractValue) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/websites/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      id: websitesTable.id, customerId: websitesTable.customerId, customerName: customersTable.name,
      websiteName: websitesTable.websiteName, cms: websitesTable.cms, technology: websitesTable.technology,
      domainId: websitesTable.domainId, domainName: domainsTable.domainName,
      hostingId: websitesTable.hostingId, hostingName: hostingsTable.hostingName,
      startDate: websitesTable.startDate, deadline: websitesTable.deadline,
      deliveryDate: websitesTable.deliveryDate, contractValue: websitesTable.contractValue,
      adminUrl: websitesTable.adminUrl, username: websitesTable.username,
      status: websitesTable.status, note: websitesTable.note,
      createdAt: websitesTable.createdAt, updatedAt: websitesTable.updatedAt,
    }).from(websitesTable)
      .leftJoin(customersTable, eq(websitesTable.customerId, customersTable.id))
      .leftJoin(domainsTable, eq(websitesTable.domainId, domainsTable.id))
      .leftJoin(hostingsTable, eq(websitesTable.hostingId, hostingsTable.id))
      .where(eq(websitesTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...row, contractValue: row.contractValue ? Number(row.contractValue) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/websites/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ["customerId", "websiteName", "cms", "technology", "domainId", "hostingId", "startDate", "deadline", "deliveryDate", "adminUrl", "username", "status", "note"];
    for (const f of fields) { if (body[f] !== undefined) upd[f] = body[f] || null; }
    if (body.contractValue !== undefined) upd.contractValue = body.contractValue ? String(body.contractValue) : null;
    const [updated] = await db.update(websitesTable).set(upd).where(eq(websitesTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, contractValue: updated.contractValue ? Number(updated.contractValue) : null });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/websites/:id", async (req, res) => {
  try {
    await db.delete(websitesTable).where(eq(websitesTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
