import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { CORS_OPTIONS } from "./middleware/cors";
import { applySecureHeaders } from "./middleware/secureHeaders";
import { requestLogger } from "./middleware/logger";
import { RATE_LIMIT } from "./middleware/rateLimit";
import { ENV } from "./config/env";

dotenv.config();
const app = express();

// === Segurança básica (modo dev seguro) ===
app.use(requestLogger);
app.use(helmet());
app.use(cors(CORS_OPTIONS));
app.use(rateLimit(RATE_LIMIT));
app.use((req, res, next) => {
  applySecureHeaders(res);
  next();
});

// === Endpoints temporários ===
app.get("/health", (_, res) => res.json({ ok: true, service: "loc-server", ts: Date.now() }));
app.get("/api/characters", (_, res) => res.json([{ id: 1, name: "Hero" }]));
app.get("/api/skills", (_, res) => res.json([{ id: 1, name: "Fireball" }]));

// === Inicialização ===
app.listen(ENV.PORT, () => {
  console.log(`[loc-server] running securely on port ${ENV.PORT}`);
});
import { Request, Response, NextFunction } from "express";

// ...

app.use((req: Request, res: Response, next: NextFunction) => {
  applySecureHeaders(res);
  next();
});
