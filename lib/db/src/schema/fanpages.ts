import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const fanpagesTable = pgTable("fanpages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  pageName: text("page_name").notNull(),
  pageUrl: text("page_url").notNull(),
  pageId: text("page_id"),
  category: text("category"),
  followers: integer("followers"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFanpageSchema = createInsertSchema(fanpagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFanpage = z.infer<typeof insertFanpageSchema>;
export type Fanpage = typeof fanpagesTable.$inferSelect;
