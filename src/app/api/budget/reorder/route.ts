import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { type, items, groupId, moveData } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 }
      );
    }

    if (type === "group") {
      await prisma.$transaction(
        items.map((id, index) =>
          prisma.categoryGroup.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    } else if (type === "category") {
      if (!groupId) {
        return NextResponse.json(
          { error: "Group ID is required for category reordering" },
          { status: 400 }
        );
      }

      // If moveData is present, we're moving between groups
      if (moveData) {
        const { categoryId, targetGroupId } = moveData;

        await prisma.$transaction([
          // Update the category's group
          prisma.category.update({
            where: { id: categoryId },
            data: {
              groupId: targetGroupId,
            },
          }),
          // Update all categories in target group with new order
          ...items.map((id, index) =>
            prisma.category.update({
              where: { id },
              data: { order: index },
            })
          ),
        ]);
      } else {
        // Regular reordering within the same group
        await prisma.$transaction(
          items.map((id, index) =>
            prisma.category.update({
              where: { id, groupId },
              data: { order: index },
            })
          )
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder items" },
      { status: 500 }
    );
  }
}
