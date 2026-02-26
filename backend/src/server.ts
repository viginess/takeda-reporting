import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./trpc/index.js";
import cron from "node-cron";
import { runArchiver } from "./jobs/archiver.js";

const server = createHTTPServer({
  router: appRouter,
  createContext({ req }) {
    return {
      ip: req.socket.remoteAddress ?? "unknown",
      userAgent: req.headers["user-agent"] ?? "unknown",
      clientId: req.headers["x-client-id"] ?? "unknown",
      token: req.headers.authorization?.split(" ")[1] ?? null,
    };
  },
  middleware(req, res, next) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL ?? "",
    ].filter(Boolean);

    const origin = req.headers.origin ?? "";
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-client-id");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    const path = req.url?.split("?")[0] ?? "";
    if (path === "/" || path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "running", timestamp: new Date().toISOString() }));
      return;
    }

    next();
  },
});

// Handle port conflicts gracefully instead of crashing
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${port} is already in use. Kill the existing process and try again.`);
    console.error(`   Run: Get-NetTCPConnection -LocalPort ${port} -State Listen | ForEach-Object { taskkill /PID $_.OwningProcess /F }`);
    process.exit(1);
  } else {
    throw err;
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Export for Vercel serverless environment
export default server;

// Only listen when running directly (local development)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`🚀 tRPC server ready on http://localhost:${port}`);
    
    // Schedule archiving job: Every Sunday at midnight
    cron.schedule("0 0 * * 0", async () => {
      await runArchiver();
    });
    console.log("⏰ Report archiving cron job scheduled (Every Sunday at 00:00)");
  });
}
