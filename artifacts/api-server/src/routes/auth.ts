import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authenticate, signToken } from "../middleware/auth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return void res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });

    // Demo login for testing
    const demoEmail = process.env.DEMO_EMAIL || "admin@butpha.vn";
    const demoPassword = process.env.DEMO_PASSWORD || "admin";
    if (email.toLowerCase().trim() === demoEmail.toLowerCase() && password === demoPassword) {
      const demoUser = {
        id: 1,
        email: demoEmail,
        fullName: "Administrator",
        role: "Admin",
      };
      const token = signToken({ userId: demoUser.id, email: demoUser.email, role: demoUser.role });
      return res.json({
        token,
        user: demoUser,
      });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
    if (!user) return void res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    if (user.status !== "active") return void res.status(403).json({ error: "Tài khoản đã bị khóa" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return void res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    // Demo user for /api/auth/me
    if (userId === 1) {
      return res.json({
        id: 1,
        email: "admin@butpha.vn",
        fullName: "Administrator",
        role: "Admin",
        status: "active",
      });
    }

    const [user] = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      fullName: usersTable.fullName,
      role: usersTable.role,
      status: usersTable.status,
    }).from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return void res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/change-password", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return void res.status(400).json({ error: "Thiếu thông tin" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return void res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return void res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ password: hashed, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
