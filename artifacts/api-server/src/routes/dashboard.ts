import { Router } from "express";
import { db, receiptsTable, expensesTable, contractsTable } from "@workspace/db";
import { sql, gte, lte, and } from "drizzle-orm";
import { GetDashboardSummaryQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const query = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });

  const now = new Date();
  const month = query.data.month ?? now.getMonth() + 1;
  const year = query.data.year ?? now.getFullYear();

  const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevFrom = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevTo = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

  const [revenueResult, expenseResult, prevRevenueResult, prevExpenseResult, allTimeRevenue, allTimeExpenses, contracts] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable)
      .where(and(gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate))),
    db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(expensesTable)
      .where(and(gte(expensesTable.expenseDate, fromDate), lte(expensesTable.expenseDate, toDate))),
    db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable)
      .where(and(gte(receiptsTable.receiptDate, prevFrom), lte(receiptsTable.receiptDate, prevTo))),
    db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(expensesTable)
      .where(and(gte(expensesTable.expenseDate, prevFrom), lte(expensesTable.expenseDate, prevTo))),
    db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable),
    db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(expensesTable),
    db.select({ totalValue: contractsTable.totalValue, paidAmount: contractsTable.paidAmount }).from(contractsTable),
  ]);

  const totalRevenue = parseFloat(revenueResult[0].total);
  const totalExpenses = parseFloat(expenseResult[0].total);
  const totalProfit = totalRevenue - totalExpenses;
  const prevRevenue = parseFloat(prevRevenueResult[0].total);
  const prevExpenses = parseFloat(prevExpenseResult[0].total);
  const prevProfit = prevRevenue - prevExpenses;

  const totalReceivable = contracts.reduce((sum, c) => {
    const remaining = parseFloat(c.totalValue ?? "0") - parseFloat(c.paidAmount ?? "0");
    return sum + Math.max(0, remaining);
  }, 0);

  const cashBalance = parseFloat(allTimeRevenue[0].total) - parseFloat(allTimeExpenses[0].total);
  const growth = (current: number, prev: number) => prev === 0 ? null : Math.round(((current - prev) / prev) * 100 * 100) / 100;

  return res.json({
    totalRevenue, totalExpenses, totalProfit,
    totalReceivable, totalPayable: 0, cashBalance,
    revenueGrowth: growth(totalRevenue, prevRevenue),
    expenseGrowth: growth(totalExpenses, prevExpenses),
    profitGrowth: growth(totalProfit, prevProfit),
  });
});

router.get("/dashboard/revenue-chart", async (req, res) => {
  const now = new Date();
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const fromDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const toDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [rev, exp] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(receiptsTable)
        .where(and(gte(receiptsTable.receiptDate, fromDate), lte(receiptsTable.receiptDate, toDate))),
      db.select({ total: sql<string>`COALESCE(sum(amount::numeric), 0)` }).from(expensesTable)
        .where(and(gte(expensesTable.expenseDate, fromDate), lte(expensesTable.expenseDate, toDate))),
    ]);

    const revenue = parseFloat(rev[0].total);
    const expenses = parseFloat(exp[0].total);
    const labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    months.push({ month: m, year: y, label: `${labels[m - 1]}/${y}`, revenue, expenses, profit: revenue - expenses });
  }

  return res.json(months);
});

router.get("/dashboard/recent-activity", async (req, res) => {
  const [recentReceipts, recentExpenses] = await Promise.all([
    db.select().from(receiptsTable).orderBy(sql`${receiptsTable.createdAt} desc`).limit(5),
    db.select().from(expensesTable).orderBy(sql`${expensesTable.createdAt} desc`).limit(5),
  ]);

  return res.json({
    recentReceipts: recentReceipts.map((r) => ({ ...r, amount: parseFloat(r.amount), customerName: "", contractCode: null, serviceName: null })),
    recentExpenses: recentExpenses.map((e) => ({ ...e, amount: parseFloat(e.amount), supplierName: null, serviceName: null })),
  });
});

export default router;
