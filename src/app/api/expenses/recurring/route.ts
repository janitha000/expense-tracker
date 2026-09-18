import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { recurringExpenseSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = recurringExpenseSchema.parse(body);
    const created = await dataLayer.createRecurringExpenses(validated);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation or recurring expense creation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
