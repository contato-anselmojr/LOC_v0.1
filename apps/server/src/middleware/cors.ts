/**
 * cors.ts - CORS configuration placeholder.
 * In production: use express + cors({ origin: process.env.LOC_WEB_ORIGIN })
 */
export const CORS_OPTIONS = {
  origin: process.env.LOC_WEB_ORIGIN || "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization","x-loc-token"]
};
