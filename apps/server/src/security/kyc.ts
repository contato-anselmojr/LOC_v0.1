/**
 * kyc.ts
 * KYC endpoints skeleton. Integrate with providers (Onfido, Jumio, Veriff).
 * Flow:
 *  - POST /api/kyc/submit  -> returns ticket id
 *  - GET  /api/kyc/:id/status -> returns status (pending/approved/rejected)
 * Note: store docs securely, do NOT keep raw PII in logs.
 */

import * as fs from "fs";
import * as path from "path";
const DB = path.join(__dirname, "..", "storage", "kyc.json");
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ tickets: [] }), "utf8");

export function submitKyc(userId: string, payload: any) {
  const db = JSON.parse(fs.readFileSync(DB, "utf8"));
  const ticket = { id: "kyc_" + Date.now(), userId, payload, status: "pending", createdAt: Date.now() };
  db.tickets.push(ticket);
  fs.writeFileSync(DB, JSON.stringify(db, null, 2), "utf8");
  return ticket;
}

export function getKycStatus(id: string) {
  const db = JSON.parse(fs.readFileSync(DB, "utf8"));
  return db.tickets.find((t: any) => t.id === id) || null;
}
