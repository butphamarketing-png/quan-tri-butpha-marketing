import { pgTable, text, serial, timestamp, integer, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const hostingsTable = pgTable("hostings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  hostingName: text("hosting_name").notNull(),
  provider: text("provider").notNull(),
  package: text("package").notNull(),
  capacity: text("capacity"),
  registerDate: date("register_date", { mode: "string" }).notNull(),
  expireDate: date("expire_date", { mode: "string" }).notNull(),
  buyPrice: numeric("buy_price", { precision: 18, scale: 2 }),
  sellPrice: numeric("sell_price", { precision: 18, scale: 2 }),
  status: text("status").notNull().default("active"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHostingSchema = createInsertSchema(hostingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHosting = z.infer<typeof insertHostingSchema>;
export type Hosting = typeof hostingsTable.$inferSelect;
