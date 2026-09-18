import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, desc, and } from "drizzle-orm";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_BASELINE_BUDGET,
  DEFAULT_CATEGORY_BUDGET_MAP,
} from "@/lib/constants";
import {
  Category,
  Expense,
  ExpenseWithCategory,
  MonthlyBudget,
  CategoryBudget,
  ParentType,
} from "@/lib/types";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

// Live Neon DB instance if database URL is set
export const db = databaseUrl ? drizzle(neon(databaseUrl), { schema }) : null;

export function isLiveDatabase(): boolean {
  return !!databaseUrl;
}

// In-Memory fallback store for demo mode & local testing when DATABASE_URL is not provided
class InMemoryStore {
  private categories: Category[] = [...DEFAULT_CATEGORIES];
  private expenses: Expense[] = []; // Clean initial state with 0 dummy expenses
  private budgets: MonthlyBudget[] = [];
  private categoryBudgets: CategoryBudget[] = [];

  constructor() {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    this.budgets.push({
      id: "b-current",
      month: currentMonth,
      baselineAmount: DEFAULT_BASELINE_BUDGET,
      createdAt: now.toISOString(),
    });

    this.ensureCategoryBudgetsForMonth(currentMonth);
  }

  private ensureCategoryBudgetsForMonth(month: string) {
    const existing = this.categoryBudgets.filter((cb) => cb.month === month);
    if (existing.length === 0) {
      for (const cat of this.categories) {
        const defaultAmt = DEFAULT_CATEGORY_BUDGET_MAP[cat.name] || 25000;
        this.categoryBudgets.push({
          id: `cb-${month}-${cat.id}`,
          month,
          categoryId: cat.id,
          budgetAmount: defaultAmt,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  public getCategories(): Category[] {
    return [...this.categories];
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  public createCategory(data: { name: string; icon: string; color: string }): Category {
    const newCat: Category = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      icon: data.icon,
      color: data.color,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    this.categories.push(newCat);
    return newCat;
  }

  public deleteCategory(id: string): boolean {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat || !cat.isCustom) return false;
    this.categories = this.categories.filter((c) => c.id !== id);
    this.expenses = this.expenses.filter((e) => e.categoryId !== id);
    this.categoryBudgets = this.categoryBudgets.filter((cb) => cb.categoryId !== id);
    return true;
  }

  public getExpenses(filters?: {
    month?: string;
    categoryId?: string;
    parentType?: ParentType | "all";
  }): ExpenseWithCategory[] {
    let result = [...this.expenses];

    if (filters?.month) {
      result = result.filter((e) => e.date.startsWith(filters.month!));
    }
    if (filters?.categoryId && filters.categoryId !== "all") {
      result = result.filter((e) => e.categoryId === filters.categoryId);
    }
    if (filters?.parentType && filters.parentType !== "all") {
      result = result.filter((e) => e.parentType === filters.parentType);
    }

    const catMap = new Map(this.categories.map((c) => [c.id, c]));
    return result.map((e) => ({
      ...e,
      category: catMap.get(e.categoryId) || {
        id: e.categoryId,
        name: "General",
        icon: "CreditCard",
        color: "#64748B",
        isCustom: false,
        createdAt: e.createdAt,
      },
    }));
  }

  public getExpenseById(id: string): ExpenseWithCategory | undefined {
    const exp = this.expenses.find((e) => e.id === id);
    if (!exp) return undefined;
    const cat = this.getCategoryById(exp.categoryId);
    return {
      ...exp,
      category: cat || {
        id: exp.categoryId,
        name: "General",
        icon: "CreditCard",
        color: "#64748B",
        isCustom: false,
        createdAt: exp.createdAt,
      },
    };
  }

  public createExpense(data: {
    amount: number | string;
    date: string;
    categoryId: string;
    parentType: ParentType;
    note?: string | null;
  }): ExpenseWithCategory {
    const newExp: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      amount: typeof data.amount === "number" ? data.amount.toFixed(2) : data.amount,
      date: data.date,
      categoryId: data.categoryId,
      parentType: data.parentType,
      note: data.note || null,
      createdAt: new Date().toISOString(),
    };
    this.expenses.push(newExp);
    return this.getExpenseById(newExp.id)!;
  }

  public updateExpense(
    id: string,
    data: Partial<{
      amount: number | string;
      date: string;
      categoryId: string;
      parentType: ParentType;
      note?: string | null;
    }>
  ): ExpenseWithCategory | undefined {
    const index = this.expenses.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const existing = this.expenses[index];
    this.expenses[index] = {
      ...existing,
      amount:
        data.amount !== undefined
          ? typeof data.amount === "number"
            ? data.amount.toFixed(2)
            : data.amount
          : existing.amount,
      date: data.date !== undefined ? data.date : existing.date,
      categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
      parentType: data.parentType !== undefined ? data.parentType : existing.parentType,
      note: data.note !== undefined ? data.note : existing.note,
    };

    return this.getExpenseById(id);
  }

  public deleteExpense(id: string): boolean {
    const initialLen = this.expenses.length;
    this.expenses = this.expenses.filter((e) => e.id !== id);
    return this.expenses.length < initialLen;
  }

  public clearAllExpenses(): void {
    this.expenses = [];
  }

  public getBudget(month: string): MonthlyBudget | undefined {
    return this.budgets.find((b) => b.month === month);
  }

  public setBudget(month: string, amount: number): MonthlyBudget {
    const index = this.budgets.findIndex((b) => b.month === month);
    if (index >= 0) {
      this.budgets[index].baselineAmount = amount.toFixed(2);
      return this.budgets[index];
    } else {
      const newBudget: MonthlyBudget = {
        id: `budget-${Date.now()}`,
        month,
        baselineAmount: amount.toFixed(2),
        createdAt: new Date().toISOString(),
      };
      this.budgets.push(newBudget);
      return newBudget;
    }
  }

  public getCategoryBudgets(month: string): CategoryBudget[] {
    this.ensureCategoryBudgetsForMonth(month);
    return this.categoryBudgets.filter((cb) => cb.month === month);
  }

  public setCategoryBudget(month: string, categoryId: string, amount: number): CategoryBudget {
    const index = this.categoryBudgets.findIndex(
      (cb) => cb.month === month && cb.categoryId === categoryId
    );
    if (index >= 0) {
      this.categoryBudgets[index].budgetAmount = amount.toFixed(2);
      return this.categoryBudgets[index];
    } else {
      const newCb: CategoryBudget = {
        id: `cb-${month}-${categoryId}`,
        month,
        categoryId,
        budgetAmount: amount.toFixed(2),
        createdAt: new Date().toISOString(),
      };
      this.categoryBudgets.push(newCb);
      return newCb;
    }
  }

  public resetToClean(): void {
    this.categories = [...DEFAULT_CATEGORIES];
    this.expenses = []; // Zero expenses
    this.categoryBudgets = [];
    const currentMonth = new Date().toISOString().substring(0, 7);
    this.ensureCategoryBudgetsForMonth(currentMonth);
  }
}

// Global in-memory singleton
const globalStore = globalThis as unknown as { __expenseStore?: InMemoryStore };
export const memoryStore = globalStore.__expenseStore || new InMemoryStore();
if (process.env.NODE_ENV !== "production") {
  globalStore.__expenseStore = memoryStore;
}

let schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized || !databaseUrl) return;
  try {
    const sql = neon(databaseUrl);
    
    // Create ENUM type if not exists
    await sql`DO $$ BEGIN
      CREATE TYPE "parent_type" AS ENUM('normal', 'one_time');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`;

    // Create categories table
    await sql`CREATE TABLE IF NOT EXISTS "categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar(255) NOT NULL,
      "icon" varchar(100) NOT NULL,
      "color" varchar(50) NOT NULL,
      "is_custom" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );`;

    // Create expenses table
    await sql`CREATE TABLE IF NOT EXISTS "expenses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "amount" numeric(12, 2) NOT NULL,
      "date" varchar(10) NOT NULL,
      "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
      "parent_type" "parent_type" DEFAULT 'normal' NOT NULL,
      "note" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );`;

    // Create monthly_budgets table
    await sql`CREATE TABLE IF NOT EXISTS "monthly_budgets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "month" varchar(7) NOT NULL UNIQUE,
      "baseline_amount" numeric(12, 2) DEFAULT '300000.00' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );`;

    // Create category_budgets table
    await sql`CREATE TABLE IF NOT EXISTS "category_budgets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "month" varchar(7) NOT NULL,
      "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
      "budget_amount" numeric(12, 2) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );`;

    // Create unique index
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS "category_budgets_month_category_idx" ON "category_budgets" ("month", "category_id");`;

    schemaInitialized = true;
  } catch (e) {
    console.error("Auto schema initialization failed:", e);
  }
}

// Unified Data Access Layer
export const dataLayer = {
  async getCategories(): Promise<Category[]> {
    if (db) {
      try {
        await ensureSchema();
        const results = await db.select().from(schema.categories);
        if (results.length === 0) {
          await this.seedCategories();
          return await db.select().from(schema.categories);
        }
        return results.map((r) => ({
          ...r,
          isCustom: r.isCustom,
          createdAt: r.createdAt.toISOString(),
        }));
      } catch (err) {
        console.error("Neon DB query error, using fallback memory store:", err);
      }
    }
    return memoryStore.getCategories();
  },

  async createCategory(data: { name: string; icon: string; color: string }): Promise<Category> {
    if (db) {
      try {
        const [inserted] = await db
          .insert(schema.categories)
          .values({
            name: data.name,
            icon: data.icon,
            color: data.color,
            isCustom: true,
          })
          .returning();
        return {
          ...inserted,
          isCustom: inserted.isCustom,
          createdAt: inserted.createdAt.toISOString(),
        };
      } catch (err) {
        console.error("Neon DB insert error:", err);
      }
    }
    return memoryStore.createCategory(data);
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (db) {
      try {
        const [cat] = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.id, id));
        if (!cat || !cat.isCustom) return false;
        await db.delete(schema.categories).where(eq(schema.categories.id, id));
        return true;
      } catch (err) {
        console.error("Neon DB delete error:", err);
      }
    }
    return memoryStore.deleteCategory(id);
  },

  async getExpenses(filters?: {
    month?: string;
    categoryId?: string;
    parentType?: ParentType | "all";
  }): Promise<ExpenseWithCategory[]> {
    if (db) {
      try {
        await ensureSchema();
        const rows = await db.query.expenses.findMany({
          with: { category: true },
          orderBy: [desc(schema.expenses.date), desc(schema.expenses.createdAt)],
        });

        let filtered = rows;
        if (filters?.month) {
          filtered = filtered.filter((r) => r.date.startsWith(filters.month!));
        }
        if (filters?.categoryId && filters.categoryId !== "all") {
          filtered = filtered.filter((r) => r.categoryId === filters.categoryId);
        }
        if (filters?.parentType && filters.parentType !== "all") {
          filtered = filtered.filter((r) => r.parentType === filters.parentType);
        }

        return filtered.map((r) => ({
          id: r.id,
          amount: r.amount,
          date: r.date,
          categoryId: r.categoryId,
          parentType: r.parentType as ParentType,
          note: r.note,
          createdAt: r.createdAt.toISOString(),
          category: {
            ...r.category,
            createdAt: r.category.createdAt.toISOString(),
          },
        }));
      } catch (err) {
        console.error("Neon DB getExpenses error:", err);
      }
    }
    return memoryStore.getExpenses(filters);
  },

  async createExpense(data: {
    amount: number | string;
    date: string;
    categoryId: string;
    parentType: ParentType;
    note?: string | null;
  }): Promise<ExpenseWithCategory> {
    if (db) {
      try {
        await ensureSchema();
        const [inserted] = await db
          .insert(schema.expenses)
          .values({
            amount: typeof data.amount === "number" ? data.amount.toFixed(2) : data.amount,
            date: data.date,
            categoryId: data.categoryId,
            parentType: data.parentType,
            note: data.note || null,
          })
          .returning();

        const cat = await db.query.categories.findFirst({
          where: eq(schema.categories.id, data.categoryId),
        });

        return {
          id: inserted.id,
          amount: inserted.amount,
          date: inserted.date,
          categoryId: inserted.categoryId,
          parentType: inserted.parentType as ParentType,
          note: inserted.note,
          createdAt: inserted.createdAt.toISOString(),
          category: cat
            ? { ...cat, createdAt: cat.createdAt.toISOString() }
            : {
                id: data.categoryId,
                name: "General",
                icon: "CreditCard",
                color: "#64748B",
                isCustom: false,
                createdAt: new Date().toISOString(),
              },
        };
      } catch (err) {
        console.error("Neon DB createExpense error:", err);
      }
    }
    return memoryStore.createExpense(data);
  },

  async updateExpense(
    id: string,
    data: Partial<{
      amount: number | string;
      date: string;
      categoryId: string;
      parentType: ParentType;
      note?: string | null;
    }>
  ): Promise<ExpenseWithCategory | undefined> {
    if (db) {
      try {
        const updateValues: Record<string, unknown> = {};
        if (data.amount !== undefined) {
          updateValues.amount =
            typeof data.amount === "number" ? data.amount.toFixed(2) : data.amount;
        }
        if (data.date !== undefined) updateValues.date = data.date;
        if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
        if (data.parentType !== undefined) updateValues.parentType = data.parentType;
        if (data.note !== undefined) updateValues.note = data.note;

        const [updated] = await db
          .update(schema.expenses)
          .set(updateValues)
          .where(eq(schema.expenses.id, id))
          .returning();

        if (!updated) return undefined;

        const cat = await db.query.categories.findFirst({
          where: eq(schema.categories.id, updated.categoryId),
        });

        return {
          id: updated.id,
          amount: updated.amount,
          date: updated.date,
          categoryId: updated.categoryId,
          parentType: updated.parentType as ParentType,
          note: updated.note,
          createdAt: updated.createdAt.toISOString(),
          category: cat
            ? { ...cat, createdAt: cat.createdAt.toISOString() }
            : {
                id: updated.categoryId,
                name: "General",
                icon: "CreditCard",
                color: "#64748B",
                isCustom: false,
                createdAt: new Date().toISOString(),
              },
        };
      } catch (err) {
        console.error("Neon DB updateExpense error:", err);
      }
    }
    return memoryStore.updateExpense(id, data);
  },

  async deleteExpense(id: string): Promise<boolean> {
    if (db) {
      try {
        await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
        return true;
      } catch (err) {
        console.error("Neon DB deleteExpense error:", err);
      }
    }
    return memoryStore.deleteExpense(id);
  },

  async clearAllExpenses(): Promise<void> {
    if (db) {
      try {
        await db.delete(schema.expenses);
      } catch (err) {
        console.error("Neon DB clear expenses error:", err);
      }
    }
    memoryStore.clearAllExpenses();
  },

  async getBudget(month: string): Promise<MonthlyBudget | null> {
    if (db) {
      try {
        await ensureSchema();
        const result = await db.query.monthlyBudgets.findFirst({
          where: eq(schema.monthlyBudgets.month, month),
        });
        if (result) {
          return {
            ...result,
            createdAt: result.createdAt.toISOString(),
          };
        }
      } catch (err) {
        console.error("Neon DB getBudget error:", err);
      }
    }
    return memoryStore.getBudget(month) || null;
  },

  async setBudget(month: string, amount: number): Promise<MonthlyBudget> {
    if (db) {
      try {
        await ensureSchema();
        const existing = await db.query.monthlyBudgets.findFirst({
          where: eq(schema.monthlyBudgets.month, month),
        });

        if (existing) {
          const [updated] = await db
            .update(schema.monthlyBudgets)
            .set({ baselineAmount: amount.toFixed(2) })
            .where(eq(schema.monthlyBudgets.month, month))
            .returning();
          return { ...updated, createdAt: updated.createdAt.toISOString() };
        } else {
          const [inserted] = await db
            .insert(schema.monthlyBudgets)
            .values({ month, baselineAmount: amount.toFixed(2) })
            .returning();
          return { ...inserted, createdAt: inserted.createdAt.toISOString() };
        }
      } catch (err) {
        console.error("Neon DB setBudget error:", err);
      }
    }
    return memoryStore.setBudget(month, amount);
  },

  async getCategoryBudgets(month: string): Promise<CategoryBudget[]> {
    if (db) {
      try {
        await ensureSchema();
        const rows = await db
          .select()
          .from(schema.categoryBudgets)
          .where(eq(schema.categoryBudgets.month, month));

        if (rows.length > 0) {
          return rows.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }));
        }

        const allCats = await this.getCategories();
        for (const cat of allCats) {
          const defaultAmt = DEFAULT_CATEGORY_BUDGET_MAP[cat.name] || 25000;
          await db
            .insert(schema.categoryBudgets)
            .values({
              month,
              categoryId: cat.id,
              budgetAmount: defaultAmt.toFixed(2),
            })
            .onConflictDoNothing();
        }

        const seededRows = await db
          .select()
          .from(schema.categoryBudgets)
          .where(eq(schema.categoryBudgets.month, month));

        return seededRows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }));
      } catch (err) {
        console.error("Neon DB getCategoryBudgets error:", err);
      }
    }
    return memoryStore.getCategoryBudgets(month);
  },

  async setCategoryBudget(
    month: string,
    categoryId: string,
    amount: number
  ): Promise<CategoryBudget> {
    if (db) {
      try {
        const existing = await db.query.categoryBudgets.findFirst({
          where: and(
            eq(schema.categoryBudgets.month, month),
            eq(schema.categoryBudgets.categoryId, categoryId)
          ),
        });

        if (existing) {
          const [updated] = await db
            .update(schema.categoryBudgets)
            .set({ budgetAmount: amount.toFixed(2) })
            .where(
              and(
                eq(schema.categoryBudgets.month, month),
                eq(schema.categoryBudgets.categoryId, categoryId)
              )
            )
            .returning();
          return { ...updated, createdAt: updated.createdAt.toISOString() };
        } else {
          const [inserted] = await db
            .insert(schema.categoryBudgets)
            .values({
              month,
              categoryId,
              budgetAmount: amount.toFixed(2),
            })
            .returning();
          return { ...inserted, createdAt: inserted.createdAt.toISOString() };
        }
      } catch (err) {
        console.error("Neon DB setCategoryBudget error:", err);
      }
    }
    return memoryStore.setCategoryBudget(month, categoryId, amount);
  },

  async seedCategories(): Promise<void> {
    if (db) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            isCustom: false,
          })
          .onConflictDoNothing();
      }
    }
  },

  async resetCleanDatabase(): Promise<void> {
    if (db) {
      await this.clearAllExpenses();
      await this.seedCategories();
    } else {
      memoryStore.resetToClean();
    }
  },
};
