/**
 * auth.ts
 * Placeholder for authentication middleware.
 * - Intended to be integrated with JWT (jsonwebtoken) or other token provider.
 * - Keep checks server-side; do NOT trust client payloads for balance/credits.
 *
 * To enable:
 *  - install jsonwebtoken
 *  - set LOC_JWT_SECRET in env
 *  - replace "verifyToken" placeholder with jwt.verify(...)
 */

import { IncomingMessage, ServerResponse } from "http";

export interface UserPayload {
  id: string;
  email: string;
  roles?: string[]; // e.g. ["user"], ["admin"]
  iat?: number;
  exp?: number;
}

/**
 * verifyToken(token): Promise<UserPayload>
 * Stub: when enabling, replace implementation to verify JWT and return payload.
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  // TODO: replace with jwt.verify(token, process.env.LOC_JWT_SECRET)
  if (!token) return null;
  // naive stub for dev (DO NOT USE IN PRODUCTION)
  if (token === "dev-token") {
    return { id: "dev-user", email: "dev@example.com", roles: ["user"] };
  }
  return null;
}

/**
 * express-style middleware example (if using express)
 * (req, res, next) => { ... }
 */
export function requireAuth(req: any, res: any, next: any) {
  const token = req.headers && (req.headers["authorization"] || req.headers["x-loc-token"]);
  const raw = typeof token === "string" ? token.replace(/^Bearer\s+/i, "") : token;
  verifyToken(raw).then(user => {
    if (!user) {
      res.statusCode = 401; res.end(JSON.stringify({ error: "unauthorized" })); return;
    }
    req.user = user;
    next();
  }).catch(err => {
    res.statusCode = 401; res.end(JSON.stringify({ error: "unauthorized" })); return;
  });
}
