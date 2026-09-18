import { NextResponse } from "next/server";
import { dataLayer } from "@/db";

export async function POST() {
  try {
    await dataLayer.resetCleanDatabase();
    return NextResponse.json({
      success: true,
      message: "Database cleaned and initialized with standard categories and zero dummy expenses",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reset database";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
