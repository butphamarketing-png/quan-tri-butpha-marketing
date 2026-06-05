import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const googleAdsTable = pgTable("google_ads", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  campaignName: text("campaign_name").notNull(),
  budget: numeric("budget", { precision: 18, scale: 2 }).notNull(),
  spend: numeric("spend", { precision: 18, scale: 2 }).notNull().default("0"),
  leads: integer("leads").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  phoneCalls: integer("phone_calls").notNull().default(0),
  directions: integer("directions").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGoogleAdSchema = createInsertSchema(googleAdsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoogleAd = z.infer<typeof insertGoogleAdSchema>;
export type GoogleAd = typeof googleAdsTable.$inferSelect;
