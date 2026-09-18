import { NextResponse } from "next/server";
import { dataLayer } from "@/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const url = new URL(req.url);
    const fromDate = url.searchParams.get("fromDate") || undefined;

    const count = await dataLayer.deleteRecurringGroup(groupId, fromDate);
    return NextResponse.json({ success: true, count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete recurring expenses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await req.json();
    const { amount, categoryId, parentType, note, fromDate } = body;

    const count = await dataLayer.updateRecurringGroup(
      groupId,
      { amount, categoryId, parentType, note },
      fromDate
    );
    return NextResponse.json({ success: true, count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update recurring expenses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
