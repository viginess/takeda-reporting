// Re-export all tables from their dedicated schema files
// This keeps db/index.ts and drizzle.config.ts working without changes
export * from "./patient/patient.schema.js";