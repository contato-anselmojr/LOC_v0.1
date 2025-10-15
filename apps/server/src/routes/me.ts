import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

router.get("/me", async (req, res) => {
  try {
    const token = req.headers["x-loc-token"];
    if (!token || typeof token !== "string")
      return res.status(401).json({ error: "missing_token" });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, nickname: true, xp: true, cash: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: "user_not_found" });
    res.json(user);
  } catch (err: any) {
    console.error("? me_failed:", err.message);
    res.status(401).json({ error: "invalid_token", details: err.message });
  }
});

export default router;
