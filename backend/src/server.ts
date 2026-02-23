import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./trpc/index.js";

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

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
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

server.listen(port, () => {
  console.log(`🚀 tRPC server ready on http://localhost:${port}`);
});
