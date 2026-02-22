import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey(), // This will match the UID from auth.users
  email: text("email").notNull().unique(),
  role: text("role").default("admin"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
