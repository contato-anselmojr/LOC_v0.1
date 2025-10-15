/**
 * env.ts - loads env vars (fallback defaults)
 */
import * as fs from "fs";
import * as path from "path";

export const ENV = {
  PORT: process.env.PORT || "3001",
  NODE_ENV: process.env.NODE_ENV || "development",
  LOC_WEB_ORIGIN: process.env.LOC_WEB_ORIGIN || "http://localhost:5173",
  LOC_JWT_SECRET: process.env.LOC_JWT_SECRET || "dev-secret",
  LOC_TOKEN: process.env.LOC_TOKEN || "dev-token"
};
