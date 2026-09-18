import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { DEFAULT_CATEGORIES, DEFAULT_BASELINE_BUDGET, DEFAULT_CATEGORY_BUDGET_MAP } from "../lib/constants";

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("⚠️ No DATABASE_URL found in .env.local. Skipping PostgreSQL direct seed.");
    return;
  }

  console.log("🌱 Connecting to Neon PostgreSQL and initializing standard categories & budgets...");
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  // 1. Seed Categories
  console.log("Inserting default standard categories...");
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

  // 2. Seed Monthly Budget
  console.log("Setting baseline monthly budget...");
  const currentMonth = new Date().toISOString().substring(0, 7);
  await db
    .insert(schema.monthlyBudgets)
    .values({
      month: currentMonth,
      baselineAmount: DEFAULT_BASELINE_BUDGET.toFixed(2),
    })
    .onConflictDoNothing();

  // 3. Seed Category Budgets
  console.log("Setting default category budgets...");
  for (const cat of DEFAULT_CATEGORIES) {
    const defaultAmt = DEFAULT_CATEGORY_BUDGET_MAP[cat.name] || 25000;
    await db
      .insert(schema.categoryBudgets)
      .values({
        month: currentMonth,
        categoryId: cat.id,
        budgetAmount: defaultAmt.toFixed(2),
      })
      .onConflictDoNothing();
  }

  console.log("✅ Neon PostgreSQL database initialized cleanly with 0 dummy expenses!");
}

runSeed().catch((err) => {
  console.error("❌ Initialization failed:", err);
  process.exit(1);
});
