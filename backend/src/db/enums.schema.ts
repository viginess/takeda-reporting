import { pgEnum } from "drizzle-orm/pg-core";

export const severityEnum = pgEnum("severity", ["info", "warning", "urgent"]);
export const statusEnum = pgEnum("status", ["new", "under_review", "approved", "closed"]);
