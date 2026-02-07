import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./trpc/index.js";

const server = createHTTPServer({
  router: appRouter,
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`Starting server on port ${port}...`);

server.listen(port);
