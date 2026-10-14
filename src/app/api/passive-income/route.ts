import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { passiveIncomeSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7);

    const amount = await dataLayer.getPassiveIncome(month);
    return NextResponse.json({
      month,
      amount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch passive income";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = passiveIncomeSchema.parse(body);
    const updated = await dataLayer.setPassiveIncome(validated.month, validated.amount);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation or save error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
