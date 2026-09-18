import { NextResponse } from "next/server";
import { dataLayer } from "@/db";

export async function POST() {
  try {
    await dataLayer.seedFullDatabase();
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to seed database";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
