import { updateCategory, deleteCategory } from "@/app/budget/actions";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    await updateCategory(params.id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update category",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCategory(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      },
      { status: 400 }
    );
  }
}
