import { Router } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router = Router();

router.get("/employees", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(employeesTable.fullName, `%${search}%`), ilike(employeesTable.email, `%${search}%`), ilike(employeesTable.phone, `%${search}%`)));
    if (status) conditions.push(eq(employeesTable.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(employeesTable).where(where).orderBy(employeesTable.fullName).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const { fullName, phone, email, role, status } = req.body;
    if (!fullName || !phone || !email) return void res.status(400).json({ error: "Missing required fields" });
    const [created] = await db.insert(employeesTable).values({ fullName, phone, email, role: role || "Sale", status: status || "active" }).returning();
    return res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/employees/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(employeesTable).where(eq(employeesTable.id, parseInt(req.params.id)));
    if (!row) return void res.status(404).json({ error: "Not found" });
    return res.json(row);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/employees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { fullName, phone, email, role, status } = req.body;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (fullName !== undefined) upd.fullName = fullName;
    if (phone !== undefined) upd.phone = phone;
    if (email !== undefined) upd.email = email;
    if (role !== undefined) upd.role = role;
    if (status !== undefined) upd.status = status;
    const [updated] = await db.update(employeesTable).set(upd).where(eq(employeesTable.id, id)).returning();
    if (!updated) return void res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/employees/:id", async (req, res) => {
  try {
    await db.delete(employeesTable).where(eq(employeesTable.id, parseInt(req.params.id)));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
