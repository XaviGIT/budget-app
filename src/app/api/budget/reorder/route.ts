import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { type, items, groupId } = await request.json();

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

      await prisma.$transaction(
        items.map((id, index) =>
          prisma.category.update({
            where: { id, groupId },
            data: { order: index },
          })
        )
      );
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
