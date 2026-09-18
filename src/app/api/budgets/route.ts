import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { budgetSchema } from "@/lib/validators";
import { DEFAULT_BASELINE_BUDGET } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7);

    const budget = await dataLayer.getBudget(month);
    return NextResponse.json(
      budget || {
        id: "default",
        month,
        baselineAmount: DEFAULT_BASELINE_BUDGET,
        createdAt: new Date().toISOString(),
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch budget";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = budgetSchema.parse(body);
    const updated = await dataLayer.setBudget(validated.month, validated.baselineAmount);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation or save error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
