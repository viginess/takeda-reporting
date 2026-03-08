/// <reference types="node" />
import { defineConfig, type Config } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/**/*.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});