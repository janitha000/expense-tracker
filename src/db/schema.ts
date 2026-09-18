import { pgTable, text, varchar, numeric, boolean, timestamp, uuid, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const parentTypeEnum = pgEnum("parent_type", ["normal", "one_time"]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // ISO YYYY-MM-DD
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  parentType: parentTypeEnum("parent_type").notNull().default("normal"),
  note: text("note"),
  recurringGroupId: uuid("recurring_group_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const monthlyBudgets = pgTable("monthly_budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  month: varchar("month", { length: 7 }).notNull().unique(), // YYYY-MM
  baselineAmount: numeric("baseline_amount", { precision: 12, scale: 2 }).default("300000.00").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categoryBudgets = pgTable(
  "category_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("category_budgets_month_category_idx").on(table.month, table.categoryId),
  ]
);

// Drizzle Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
  budgets: many(categoryBudgets),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

export const categoryBudgetsRelations = relations(categoryBudgets, ({ one }) => ({
  category: one(categories, {
    fields: [categoryBudgets.categoryId],
    references: [categories.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type MonthlyBudget = typeof monthlyBudgets.$inferSelect;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;
