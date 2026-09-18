import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { z } from "zod";

const categoryBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format" }),
  categoryId: z.string().min(1, { message: "Category ID is required" }),
  budgetAmount: z.coerce.number().positive({ message: "Budget amount must be positive" }),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7);
    const budgets = await dataLayer.getCategoryBudgets(month);
    return NextResponse.json(budgets);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch category budgets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = categoryBudgetSchema.parse(body);
    const updated = await dataLayer.setCategoryBudget(
      validated.month,
      validated.categoryId,
      validated.budgetAmount
    );
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation or save error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
