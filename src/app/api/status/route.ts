import { NextResponse } from "next/server";
import { db, isLiveDatabase } from "@/db";
import { categories } from "@/db/schema";

export async function GET() {
  const configured = isLiveDatabase();
  let connected = false;
  let errorMessage: string | null = null;

  if (configured && db) {
    try {
      const { ensureSchema } = await import("@/db");
      await ensureSchema();
      await db.select().from(categories).limit(1);
      connected = true;
    } catch (err: unknown) {
      connected = false;
      errorMessage = err instanceof Error ? err.message : "Database connection error";
    }
  }

  return NextResponse.json({
    isConfigured: configured,
    isConnected: connected,
    errorMessage,
  });
}
