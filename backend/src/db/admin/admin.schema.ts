import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { adminRoleEnum } from "../shared/enums.schema.js";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey(), // This will match the UID from auth.users
  email: text("email").notNull().unique(),
  role: adminRoleEnum("role").default("admin"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  
  // Security Policy Tracking Fields
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedAt: timestamp("locked_at"),
  passwordChangedAt: timestamp("password_changed_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
