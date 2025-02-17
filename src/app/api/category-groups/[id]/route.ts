import { updateCategoryGroup, deleteCategoryGroup } from "@/app/budget/actions";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    await updateCategoryGroup(params.id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update category group error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update category group",
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
    const { transferToGroupId } = await request.json();
    await deleteCategoryGroup(params.id, transferToGroupId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category group error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete category group",
      },
      { status: 500 }
    );
  }
}
