import { NextResponse } from "next/server";
import { dataLayer } from "@/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await dataLayer.deleteCategory(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Category not found or cannot delete default category" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
