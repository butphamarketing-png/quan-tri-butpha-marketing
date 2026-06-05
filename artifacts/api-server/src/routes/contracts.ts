import { Router } from "express";
import { db, contractsTable, customersTable, servicesTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";
import { CreateContractBody, UpdateContractBody, GetContractParams, UpdateContractParams, DeleteContractParams, ListContractsQueryParams } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

async function enrichContract(contract: typeof contractsTable.$inferSelect) {
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, contract.customerId)).limit(1);
  let serviceName: string | null = null;
  if (contract.serviceId) {
    const [svc] = await db.select({ name: servicesTable.name }).from(servicesTable).where(eq(servicesTable.id, contract.serviceId)).limit(1);
    serviceName = svc?.name ?? null;
  }
  const totalValue = parseFloat(contract.totalValue ?? "0");
  const paidAmount = parseFloat(contract.paidAmount ?? "0");
  return {
    ...contract,
    totalValue,
    paidAmount,
    remainingAmount: totalValue - paidAmount,
    customerName: customer?.name ?? "Unknown",
    serviceName,
  };
}

router.get("/contracts", async (req, res) => {
  const query = ListContractsQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { customerId, status, search, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (customerId) conditions.push(eq(contractsTable.customerId, customerId));
  if (status) conditions.push(eq(contractsTable.status, status));
  if (search) conditions.push(ilike(contractsTable.code, `%${search}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(contractsTable).where(where).limit(limit).offset(offset).orderBy(contractsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(contractsTable).where(where),
  ]);

  const data = await Promise.all(rows.map(enrichContract));
  return res.json({ data, total: totalResult[0].count, page, limit });
});

router.post("/contracts", async (req, res) => {
  const body = CreateContractBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [contract] = await db.insert(contractsTable).values({
    ...body.data,
    totalValue: String(body.data.totalValue),
  }).returning();
  const enriched = await enrichContract(contract);
  await logAudit("contract", contract.id, "create", "Admin", null, enriched);
  return res.status(201).json(enriched);
});

router.get("/contracts/:id", async (req, res) => {
  const params = GetContractParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id)).limit(1);
  if (!contract) return res.status(404).json({ error: "Not found" });
  return res.json(await enrichContract(contract));
});

router.patch("/contracts/:id", async (req, res) => {
  const params = UpdateContractParams.safeParse(req.params);
  const body = UpdateContractBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid data" });

  const [existing] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.totalValue !== undefined) updateData.totalValue = String(body.data.totalValue);

  const [updated] = await db.update(contractsTable).set(updateData).where(eq(contractsTable.id, params.data.id)).returning();
  const enriched = await enrichContract(updated);
  await logAudit("contract", updated.id, "update", "Admin", await enrichContract(existing), enriched);
  return res.json(enriched);
});

router.delete("/contracts/:id", async (req, res) => {
  const params = DeleteContractParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });

  await db.delete(contractsTable).where(eq(contractsTable.id, params.data.id));
  await logAudit("contract", params.data.id, "delete", "Admin", existing, null);
  return res.status(204).send();
});

export default router;
