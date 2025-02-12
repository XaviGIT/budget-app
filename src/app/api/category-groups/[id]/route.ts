import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const group = await prisma.categoryGroup.update({
      where: { id: params.id },
      data: {
        name: data.name,
      },
    });
    return NextResponse.json(group);
  } catch {
    return NextResponse.json(
      { error: "Failed to update category group" },
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

    await prisma.$transaction(async (tx) => {
      if (transferToGroupId) {
        await tx.category.updateMany({
          where: { groupId: params.id },
          data: { groupId: transferToGroupId },
        });
      }
      await tx.categoryGroup.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete category group" },
      { status: 500 }
    );
  }
}
