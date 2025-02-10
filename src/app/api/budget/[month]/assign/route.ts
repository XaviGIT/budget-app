import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { month: string } }
) {
  try {
    const month = params.month;
    const { categoryId, amount } = await request.json();

    const assignment = await prisma.budgetAssignment.upsert({
      where: {
        month_categoryId: {
          month,
          categoryId,
        },
      },
      update: {
        amount,
      },
      create: {
        month,
        categoryId,
        amount,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Budget assignment error:", error);
    return NextResponse.json(
      { error: "Failed to save budget assignment" },
      { status: 500 }
    );
  }
}
