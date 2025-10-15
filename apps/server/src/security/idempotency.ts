/**
 * idempotency.ts
 * Simple file-backed idempotency store (dev use).
 * In production, replace with Redis or DB table with TTL and atomic insert.
 */

import * as fs from "fs";
import * as path from "path";

const DB = path.join(__dirname, "..", "storage", "idempotency.json");

// ensure file
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({}), "utf8");

interface RecordEntry { createdAt: number; result?: any }

export function getKey(key: string): RecordEntry | null {
  try {
    const raw = JSON.parse(fs.readFileSync(DB, "utf8"));
    return raw[key] || null;
  } catch { return null; }
}

export function setKey(key: string, value: any) {
  try {
    const raw = JSON.parse(fs.readFileSync(DB, "utf8"));
    raw[key] = { createdAt: Date.now(), result: value };
    fs.writeFileSync(DB, JSON.stringify(raw, null, 2), "utf8");
  } catch (e) {
    // best-effort
  }
}
