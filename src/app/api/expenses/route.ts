import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { expenseSchema } from "@/lib/validators";
import { ParentType } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const parentType = (searchParams.get("parentType") as ParentType | "all") || undefined;

    const expenses = await dataLayer.getExpenses({
      month,
      categoryId,
      parentType,
    });
    return NextResponse.json(expenses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch expenses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = expenseSchema.parse(body);
    const created = await dataLayer.createExpense(validated);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation or creation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
