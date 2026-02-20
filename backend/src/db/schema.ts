import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientName: text("patient_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  createdAt: timestamp("created_at").defaultNow(),
});