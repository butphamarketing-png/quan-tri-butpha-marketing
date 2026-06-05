import { Router } from "express";
import { db, contractsTable, customersTable, expensesTable, suppliersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ListAccountsReceivableQueryParams, ListAccountsPayableQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/accounts-receivable", async (req, res) => {
  const query = ListAccountsReceivableQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { status, customerId, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const today = new Date().toISOString().split("T")[0];

  const contracts = await db
    .select({
      contractId: contractsTable.id,
      contractCode: contractsTable.code,
      customerId: contractsTable.customerId,
      totalValue: contractsTable.totalValue,
      paidAmount: contractsTable.paidAmount,
      dueDate: contractsTable.dueDate,
      customerName: customersTable.name,
    })
    .from(contractsTable)
    .leftJoin(customersTable, eq(contractsTable.customerId, customersTable.id));

  const items = contracts
    .map((c) => {
      const totalContractValue = parseFloat(c.totalValue ?? "0");
      const paid = parseFloat(c.paidAmount ?? "0");
      const remaining = totalContractValue - paid;
      let arStatus: string;
      if (remaining <= 0) {
        arStatus = "paid";
      } else if (c.dueDate && c.dueDate < today) {
        arStatus = "overdue";
      } else {
        arStatus = "unpaid";
      }
      return {
        customerId: c.customerId,
        customerName: c.customerName ?? "Unknown",
        contractId: c.contractId,
        contractCode: c.contractCode,
        totalContractValue,
        paidAmount: paid,
        remainingAmount: remaining,
        dueDate: c.dueDate,
        status: arStatus,
      };
    })
    .filter((item) => {
      if (status && item.status !== status) return false;
      if (customerId && item.customerId !== customerId) return false;
      return true;
    });

  const total = items.length;
  const paginated = items.slice(offset, offset + limit);
  const totalReceivable = items.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.remainingAmount, 0);

  return res.json({ data: paginated, total, page, limit, totalReceivable });
});

router.get("/accounts-payable", async (req, res) => {
  const query = ListAccountsPayableQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { status, supplierId, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      supplierId: expensesTable.supplierId,
      supplierName: suppliersTable.name,
      category: expensesTable.category,
      total: sql<string>`sum(${expensesTable.amount}::numeric)`,
    })
    .from(expensesTable)
    .leftJoin(suppliersTable, eq(expensesTable.supplierId, suppliersTable.id))
    .groupBy(expensesTable.supplierId, suppliersTable.name, expensesTable.category);

  const items = rows
    .filter((r) => r.supplierId !== null)
    .map((r) => {
      const totalAmount = parseFloat(r.total ?? "0");
      const paidAmount = 0;
      const remainingAmount = totalAmount - paidAmount;
      const arStatus = remainingAmount <= 0 ? "paid" : "unpaid";
      return {
        supplierId: r.supplierId!,
        supplierName: r.supplierName ?? "Unknown",
        category: r.category,
        totalAmount,
        paidAmount,
        remainingAmount,
        status: arStatus,
      };
    })
    .filter((item) => {
      if (status && item.status !== status) return false;
      if (supplierId && item.supplierId !== supplierId) return false;
      return true;
    });

  const total = items.length;
  const paginated = items.slice(offset, offset + limit);
  const totalPayable = items.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.remainingAmount, 0);

  return res.json({ data: paginated, total, page, limit, totalPayable });
});

export default router;
