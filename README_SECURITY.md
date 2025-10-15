# README_SECURITY.md

Security scaffolding (pre-esqueleton) for LOC_v0.2

Files created under: apps/server/src/security/*

Purpose:
- Provide clear, commented placeholders for:
  - authentication (JWT)
  - idempotency keys (dev file store; replace with Redis in prod)
  - payouts flow (reserve/create/status)
  - audit append log (immutable-ish)
  - KYC ticketing skeleton
  - rateLimit guidance

Next steps to enable in production:
1. Install production deps:
   npm install express jsonwebtoken express-rate-limit helmet cors dotenv stripe
2. Replace idempotency file store with Redis/DB table (atomic insert).
3. Implement server-authoritative checks: never trust client-sent values for balances.
4. Implement KYC provider integration and set thresholds to require KYC.
5. Add MFA (OTP) and strong login protections.
6. Use secrets manager (Vault / cloud secret manager) and do not commit secrets.
7. Enforce HTTPS, WAF, monitoring, and run pentests.

This scaffolding is intentionally minimal and safe for development. It does NOT enable security automatically.
