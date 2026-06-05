import { Router } from "express";
import { db, receiptsTable, expensesTable, contractsTable, customersTable, servicesTable } from "@workspace/db";
import { sql, gte, lte, and, eq } from "drizzle-orm";
import { GetRevenueReportQueryParams, GetExpenseReportQueryParams, GetProfitReportQueryParams, GetCashFlowReportQueryParams, GetCustomerReportQueryParams, GetServiceReportQueryParams } from "@workspace/api-zod";

const router = Router();

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

function periodBounds(period: string, index: number, year: number): { fromDate: string; toDate: string; label: string } {
  if (period === "monthly") {
    const fromDate = `${year}-${String(index + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, index + 1, 0).getDate();
    const toDate = `${year}-${String(index + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { fromDate, toDate, label: `${MONTH_LABELS[index]}/${year}` };
  }
  if (period === "quarterly") {
    const startMonth = index * 3 + 1;
    const endMonth = startMonth + 2;
    const fromDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(year, endMonth, 0).getDate();
    const toDate = `${year}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { fromDate, toDate, label: `Q${index + 1}/${year}` };
  }
  const y = year - 4 + index;
  return { fromDate: `${y}-01-01`, toDate: `${y}-12-31`, label: String(y) };
}

router.get("/reports/revenue", async (req, res) => {
  const query = GetRevenueReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { period = "monthly", year = new Date().getFullYear() } = query.data;
  const count = period === "monthly" ? 12 : period === "quarterly" ? 4 : 5;

  const items = [];
  for (let i = 0; i < count; i++) {
    const { fromDate, toDate, label } = periodBounds(period, i, year);
    const [result] = await db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` })
      .from(receiptsTable).where(and(gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate)));
    items.push({ label, amount: parseFloat(result.total), breakdown: [] });
  }
  return res.json({ period, year, total: items.reduce((s, i) => s + i.amount, 0), items });
});

router.get("/reports/expenses", async (req, res) => {
  const query = GetExpenseReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { period = "monthly", year = new Date().getFullYear() } = query.data;
  const count = period === "monthly" ? 12 : period === "quarterly" ? 4 : 5;

  const items = [];
  for (let i = 0; i < count; i++) {
    const { fromDate, toDate, label } = periodBounds(period, i, year);
    const [result] = await db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` })
      .from(expensesTable).where(and(gte(expensesTable.expenseDate, fromDate), lte(expensesTable.expenseDate, toDate)));
    items.push({ label, amount: parseFloat(result.total), breakdown: [] });
  }
  return res.json({ period, year, total: items.reduce((s, i) => s + i.amount, 0), items });
});

router.get("/reports/profit", async (req, res) => {
  const query = GetProfitReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { period = "monthly", year = new Date().getFullYear() } = query.data;
  const count = period === "monthly" ? 12 : period === "quarterly" ? 4 : 5;

  const items = [];
  for (let i = 0; i < count; i++) {
    const { fromDate, toDate, label } = periodBounds(period, i, year);
    const [rev, exp] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable)
        .where(and(gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate))),
      db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(expensesTable)
        .where(and(gte(expensesTable.expenseDate, fromDate), lte(expensesTable.expenseDate, toDate))),
    ]);
    const revenue = parseFloat(rev[0].total);
    const expenses = parseFloat(exp[0].total);
    items.push({ label, revenue, expenses, profit: revenue - expenses });
  }

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
  const totalExpenses = items.reduce((s, i) => s + i.expenses, 0);
  return res.json({ period, year, totalRevenue, totalExpenses, totalProfit: totalRevenue - totalExpenses, items });
});

router.get("/reports/cash-flow", async (req, res) => {
  const query = GetCashFlowReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });

  const now = new Date();
  const fromDate = query.data.fromDate ? String(query.data.fromDate) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const toDate = query.data.toDate ? String(query.data.toDate) : now.toISOString().split("T")[0];

  const [receipts, expenses] = await Promise.all([
    db.select().from(receiptsTable).where(and(gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate))).orderBy(receiptsTable.receiptDate),
    db.select().from(expensesTable).where(and(gte(expensesTable.expenseDate, fromDate), lte(expensesTable.expenseDate, toDate))).orderBy(expensesTable.expenseDate),
  ]);

  const allItems = [
    ...receipts.map((r) => ({ date: r.receiptDate, type: "inflow", description: `Thu - ${r.code}`, amount: parseFloat(r.amount) })),
    ...expenses.map((e) => ({ date: e.expenseDate, type: "outflow", description: `Chi - ${e.code} (${e.category})`, amount: parseFloat(e.amount) })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const totalInflow = receipts.reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalOutflow = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  let balance = 0;
  const itemsWithBalance = allItems.map((item) => {
    if (item.type === "inflow") balance += item.amount;
    else balance -= item.amount;
    return { ...item, balance };
  });

  return res.json({
    totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow,
    openingBalance: 0, closingBalance: balance, items: itemsWithBalance,
  });
});

router.get("/reports/by-customer", async (req, res) => {
  const query = GetCustomerReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { year = new Date().getFullYear(), month } = query.data;

  const fromDate = month ? `${year}-${String(month).padStart(2, "0")}-01` : `${year}-01-01`;
  const toDate = month
    ? `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`
    : `${year}-12-31`;

  const customers = await db.select().from(customersTable);
  const results = [];

  for (const customer of customers) {
    const [rev, contracts] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable)
        .where(and(eq(receiptsTable.customerId, customer.id), gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate))),
      db.select({ totalValue: contractsTable.totalValue, paidAmount: contractsTable.paidAmount })
        .from(contractsTable).where(eq(contractsTable.customerId, customer.id)),
    ]);

    const revenue = parseFloat(rev[0].total);
    const receivable = contracts.reduce((s, c) => s + Math.max(0, parseFloat(c.totalValue ?? "0") - parseFloat(c.paidAmount ?? "0")), 0);

    if (revenue > 0 || receivable > 0) {
      results.push({ customerId: customer.id, customerName: customer.name, revenue, expenses: 0, profit: revenue, receivable });
    }
  }

  return res.json(results);
});

router.get("/reports/by-service", async (req, res) => {
  const query = GetServiceReportQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });
  const { year = new Date().getFullYear(), month } = query.data;

  const fromDate = month ? `${year}-${String(month).padStart(2, "0")}-01` : `${year}-01-01`;
  const toDate = month
    ? `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`
    : `${year}-12-31`;

  const services = await db.select().from(servicesTable);
  const serviceTypes = [...new Set(services.map((s) => s.type))];

  const results = [];
  for (const type of serviceTypes) {
    const typeServices = services.filter((s) => s.type === type);
    let revenue = 0;
    let expenses = 0;
    for (const svc of typeServices) {
      const [rev, exp] = await Promise.all([
        db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable)
          .where(and(eq(receiptsTable.serviceId, svc.id), gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate))),
        db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(expensesTable)
          .where(and(eq(expensesTable.serviceId, svc.id), gte(expensesTable.expenseDate, fromDate), lte(expensesTable.expenseDate, toDate))),
      ]);
      revenue += parseFloat(rev[0].total);
      expenses += parseFloat(exp[0].total);
    }
    results.push({ serviceType: type, revenue, expenses, profit: revenue - expenses });
  }

  return res.json(results);
});

export default router;
