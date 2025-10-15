//
// === SECURITY-HOOKS (commented) ===
//
// import { requestLogger } from "./middleware/logger";
// import { applySecureHeaders } from "./middleware/secureHeaders";
// import { CORS_OPTIONS } from "./middleware/cors";
// import { RATE_LIMIT } from "./middleware/rateLimit";
// import { ENV } from "./config/env";
//
// // Example usage (if using express):
// // app.use(requestLogger);
// // app.use(cors(CORS_OPTIONS));
// // app.use(rateLimit(RATE_LIMIT));
// // app.use((req,res,next)=>{applySecureHeaders(res);next();});
//
import * as http from "http";
import { AddressInfo } from "net";

const PORT = Number(process.env.PORT || 3001);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    const body = JSON.stringify({ ok: true, service: "loc-server", ts: Date.now() });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(body);
    return;
  }
  res.statusCode = 404;
  res.end("Not Found");
});

server.on("error", (err) => {
  console.error("[loc-server] server error:", err);
});

process.on("uncaughtException", (e) => {
  console.error("[loc-server] uncaughtException:", e);
});
process.on("unhandledRejection", (e) => {
  console.error("[loc-server] unhandledRejection:", e);
});

server.listen(PORT, () => {
  const { port } = server.address() as AddressInfo;
  console.log(`[loc-server] listening on :${port}`);
});

