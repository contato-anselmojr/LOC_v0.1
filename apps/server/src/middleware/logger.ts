/**
 * logger.ts - simple request logger (dev safe)
 */
export function requestLogger(req: any, res: any, next: any) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next && next();
}
