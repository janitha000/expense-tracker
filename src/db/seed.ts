import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { DEFAULT_CATEGORIES, DEFAULT_BASELINE_BUDGET } from "../lib/constants";
import { generateSeedExpenses } from "./seed-data";
import { Category } from "../lib/types";

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("⚠️ No DATABASE_URL found in .env.local. Skipping PostgreSQL direct seed.");
    console.log("ℹ️ In-memory store will automatically seed default categories and sample expenses.");
    return;
  }

  console.log("🌱 Connecting to Neon PostgreSQL and seeding database...");
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  // 1. Seed Categories
  console.log("Inserting default categories...");
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

  // 2. Fetch seeded categories
  const allCats = await db.select().from(schema.categories);
  const formattedCats: Category[] = allCats.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  // 3. Seed Expenses
  console.log("Inserting 6-month historical sample expenses...");
  const seedExpenses = generateSeedExpenses(formattedCats);
  for (const exp of seedExpenses) {
    await db.insert(schema.expenses).values({
      amount: typeof exp.amount === "number" ? exp.amount.toFixed(2) : exp.amount,
      date: exp.date,
      categoryId: exp.categoryId,
      parentType: exp.parentType,
      note: exp.note,
    });
  }

  // 4. Seed Monthly Budget
  console.log("Setting baseline budget...");
  const currentMonth = new Date().toISOString().substring(0, 7);
  await db
    .insert(schema.monthlyBudgets)
    .values({
      month: currentMonth,
      baselineAmount: DEFAULT_BASELINE_BUDGET.toFixed(2),
    })
    .onConflictDoNothing();

  console.log("✅ Neon PostgreSQL database seeded successfully!");
}

runSeed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
