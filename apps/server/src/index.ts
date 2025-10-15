import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { CORS_OPTIONS } from "./middleware/cors";
import { applySecureHeaders } from "./middleware/secureHeaders";
import { requestLogger } from "./middleware/logger";
import { RATE_LIMIT } from "./middleware/rateLimit";
import { ENV } from "./config/env";
import authRoutes from "./routes/auth";

dotenv.config();
const app = express();

// === Middlewares globais ===
app.use(express.json()); // ✅ Habilita JSON no body das requisições
app.use(requestLogger);
app.use(helmet());
app.use(cors(CORS_OPTIONS));
app.use(rateLimit(RATE_LIMIT));
app.use((req: Request, res: Response, next: NextFunction) => {
  applySecureHeaders(res);
  next();
});

// === Rotas principais ===
app.get("/health", (_, res) =>
  res.json({ ok: true, service: "loc-server", ts: Date.now() })
);
app.use("/api", authRoutes);

// === Inicialização ===
app.listen(ENV.PORT, () => {
  console.log(`[loc-server] running securely on port ${ENV.PORT}`);
});

import meRoutes from './routes/me';

app.use('/api', meRoutes);
