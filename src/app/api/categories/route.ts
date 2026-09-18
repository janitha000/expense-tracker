import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { categorySchema } from "@/lib/validators";

export async function GET() {
  try {
    const categories = await dataLayer.getCategories();
    return NextResponse.json(categories);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = categorySchema.parse(body);
    const created = await dataLayer.createCategory(validated);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation or creation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
