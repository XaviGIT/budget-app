import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const groups = await prisma.categoryGroup.findMany({
      orderBy: { order: "asc" },
      include: { categories: true },
    });
    return NextResponse.json(groups);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch category groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const group = await prisma.categoryGroup.create({
      data: {
        name: data.name,
        order: data.order ?? 0,
      },
    });
    return NextResponse.json(group);
  } catch {
    return NextResponse.json(
      { error: "Failed to create category group" },
      { status: 500 }
    );
  }
}
