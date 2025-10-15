/**
 * secureHeaders.ts - adds minimal security headers.
 * In production: use helmet (npm install helmet)
 */
export function applySecureHeaders(res: any) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
}
