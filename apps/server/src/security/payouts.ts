/**
 * payouts.ts
 * Payout request skeleton and in-memory reservation for dev.
 * Replace in production with DB transactions and proper payment gateway integration.
 */

import { audit } from "./audit";
import * as fs from "fs";
import * as path from "path";

const DB = path.join(__dirname, "..", "storage", "payouts.json");
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ payouts: [], reserved: {} }), "utf8");

type PayoutStatus = "pending" | "review" | "processing" | "completed" | "rejected";

interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  createdAt: number;
  status: PayoutStatus;
  meta?: any;
}

function readDB() { return JSON.parse(fs.readFileSync(DB, "utf8")); }
function writeDB(d: any) { fs.writeFileSync(DB, JSON.stringify(d, null, 2), "utf8"); }

/**
 * reserveBalance(userId, amount): reserve funds atomically (dev).
 * In prod: use DB transaction / row-level locking.
 */
export function reserveBalance(userId: string, amount: number): boolean {
  const d = readDB();
  d.reserved = d.reserved || {};
  d.reserved[userId] = (d.reserved[userId] || 0) + amount;
  writeDB(d);
  audit("reserveBalance", { userId, amount });
  return true;
}

export function createPayout(userId: string, amount: number, currency = "USD"): Payout {
  const d = readDB();
  const payout: Payout = { id: "payout_" + Date.now(), userId, amount, currency, createdAt: Date.now(), status: "pending" };
  d.payouts.push(payout);
  writeDB(d);
  audit("createPayout", payout);
  return payout;
}

export function setPayoutStatus(id: string, status: PayoutStatus) {
  const d = readDB();
  const p = d.payouts.find((x: any) => x.id === id);
  if (p) { p.status = status; writeDB(d); audit("setPayoutStatus", { id, status }); }
  return p;
}
