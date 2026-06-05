import { pgTable, text, serial, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { domainsTable } from "./domains";
import { hostingsTable } from "./hostings";

export const websitesTable = pgTable("websites", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  websiteName: text("website_name").notNull(),
  domainId: integer("domain_id").references(() => domainsTable.id, { onDelete: "set null" }),
  hostingId: integer("hosting_id").references(() => hostingsTable.id, { onDelete: "set null" }),
  cms: text("cms").notNull(),
  technology: text("technology"),
  startDate: date("start_date", { mode: "string" }),
  deadline: date("deadline", { mode: "string" }),
  deliveryDate: date("delivery_date", { mode: "string" }),
  contractValue: numeric("contract_value", { precision: 18, scale: 2 }),
  adminUrl: text("admin_url"),
  username: text("username"),
  status: text("status").notNull().default("completed"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWebsiteSchema = createInsertSchema(websitesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websitesTable.$inferSelect;
