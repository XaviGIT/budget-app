import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assignments = await prisma.budgetAssignment.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            budgetConfig: true,
          },
        },
      },
      orderBy: [{ month: "desc" }, { category: { name: "asc" } }],
    });

    console.log("Budget assignments:", assignments);

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
