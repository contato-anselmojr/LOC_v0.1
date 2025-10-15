import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { logAction } from "../utils/logs";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// === Registro ===
router.post("/register", async (req, res) => {
  try {
    console.log("📩 Body recebido:", req.body);
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      console.warn("⚠️ Campos faltando:", req.body);
      return res.status(400).json({ error: "missing_fields" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, nickname },
    });

    // 🔹 Log automático
    await logAction(user.id, "register");

    console.log("✅ Usuário criado com sucesso:", user);
    res.json({ id: user.id, email: user.email, nickname: user.nickname });
  } catch (err: any) {
    console.error("❌ register_failed:", err.message, err);
    res.status(500).json({ error: "register_failed", details: err.message });
  }
});

// === Login ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "invalid_credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "invalid_credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // 🔹 Log automático
    await logAction(user.id, "login");

    res.json({ token });
  } catch (err: any) {
    console.error("❌ login_failed:", err.message, err);
    res.status(500).json({ error: "login_failed", details: err.message });
  }
});

export default router;
