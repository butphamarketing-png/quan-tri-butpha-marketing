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
  if (email.toLowerCase().trim() === demoEmail.toLowerCase() && password === demoPassword) {
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

export default async (req, res) => {
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
