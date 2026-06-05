import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const facebookAdsTable = pgTable("facebook_ads", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  adAccount: text("ad_account"),
  monthlyBudget: numeric("monthly_budget", { precision: 18, scale: 2 }).notNull(),
  spend: numeric("spend", { precision: 18, scale: 2 }).notNull().default("0"),
  leads: integer("leads").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFacebookAdSchema = createInsertSchema(facebookAdsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFacebookAd = z.infer<typeof insertFacebookAdSchema>;
export type FacebookAd = typeof facebookAdsTable.$inferSelect;
