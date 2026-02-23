// Re-export all tables from their dedicated schema files
// This keeps db/index.ts and drizzle.config.ts working without changes
export * from "./patient/patient.schema.js";
export * from "./hcp/hcp.schema.js";
export * from "./family/family.schema.js";
export * from "./admin/admin.schema.js";
export * from "./notifications/notifications.schema.js";
export * from "./enums.schema.js";
export * from "./audit.schema.js";
