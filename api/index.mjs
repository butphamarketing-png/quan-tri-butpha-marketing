import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Vercel Functions working!" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const demoEmail = process.env.DEMO_EMAIL || "admin@butpha.vn";
  const demoPassword = process.env.DEMO_PASSWORD || "admin";
  
  if (email?.toLowerCase().trim() === demoEmail.toLowerCase() && password === demoPassword) {
    res.json({
      token: "demo_token_123",
      user: { id: 1, email: demoEmail, fullName: "Administrator", role: "Admin" }
    });
  } else {
    res.status(401).json({ error: "Email/mật khẩu không đúng" });
  }
});

app.get("/api/auth/me", (req, res) => {
  res.json({
    id: 1,
    email: process.env.DEMO_EMAIL || "admin@butpha.vn",
    fullName: "Administrator",
    role: "Admin",
    status: "active"
  });
});

app.get("/api/dashboard/summary", (req, res) => {
  const now = new Date();
  const totalRevenue = 50000000;
  const totalExpenses = 20000000;
  const totalProfit = totalRevenue - totalExpenses;
  const totalReceivable = 30000000;
  const cashBalance = 100000000;
  
  res.json({
    totalRevenue, totalExpenses, totalProfit,
    totalReceivable, totalPayable: 15000000, cashBalance,
    revenueGrowth: 12.5, expenseGrowth: -3.2, profitGrowth: 20.1
  });
});

app.get("/api/dashboard/revenue-chart", (req, res) => {
  const now = new Date();
  const months = [];
  const labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const revenue = Math.floor(Math.random() * 50000000) + 10000000;
    const expenses = Math.floor(Math.random() * 30000000) + 5000000;
    months.push({
      month: m, year: y, label: `${labels[m-1]}/${y}`,
      revenue, expenses, profit: revenue - expenses
    });
  }
  
  res.json(months);
});

app.get("/api/dashboard/recent-activity", (req, res) => {
  res.json({
    recentReceipts: [
      { id: 1, code: "PT001", amount: 5000000, description: "Phí dịch vụ tháng 6", receiptDate: "2024-06-05" },
      { id: 2, code: "PT002", amount: 12000000, description: "Thanh toán hợp đồng", receiptDate: "2024-06-04" },
      { id: 3, code: "PT003", amount: 3500000, description: "Dịch vụ website", receiptDate: "2024-06-03" },
    ],
    recentExpenses: [
      { id: 1, code: "PC001", amount: 2000000, description: "Phí hosting", expenseDate: "2024-06-05" },
      { id: 2, code: "PC002", amount: 500000, description: "Phí domain", expenseDate: "2024-06-04" },
    ]
  });
});

export default async (req, res) => {
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
