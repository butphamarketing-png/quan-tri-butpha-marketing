import { pgTable, text, serial, timestamp, integer, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const domainsTable = pgTable("domains", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  domainName: text("domain_name").notNull(),
  provider: text("provider").notNull(),
  registerDate: date("register_date", { mode: "string" }).notNull(),
  expireDate: date("expire_date", { mode: "string" }).notNull(),
  buyPrice: numeric("buy_price", { precision: 18, scale: 2 }),
  sellPrice: numeric("sell_price", { precision: 18, scale: 2 }),
  status: text("status").notNull().default("active"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDomainSchema = createInsertSchema(domainsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domainsTable.$inferSelect;
