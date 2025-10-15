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
