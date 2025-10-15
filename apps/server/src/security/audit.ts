/**
 * audit.ts
 * Simple append-only audit logger (dev). In production, push to centralized logs / audit DB.
 */

import * as fs from "fs";
import * as path from "path";

const LOG = path.join(__dirname, "..", "storage", "audit.log");

export function audit(event: string, meta: any = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, meta }) + "\n";
  try { fs.appendFileSync(LOG, line, "utf8"); } catch {}
}
