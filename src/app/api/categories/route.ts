import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Get or create default group
    let defaultGroup = await prisma.categoryGroup.findFirst({
      where: { name: "Uncategorized" },
    });

    if (!defaultGroup) {
      defaultGroup = await prisma.categoryGroup.create({
        data: { name: "Uncategorized" },
      });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon,
        groupId: defaultGroup.id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
