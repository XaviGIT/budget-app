import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { month: string } }
) {
  const { month } = context.params;
  if (!month) {
    return NextResponse.json({ error: "Month is required" }, { status: 400 });
  }

  try {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

    const groups = await prisma.categoryGroup.findMany({
      orderBy: { order: "asc" },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: {
            assignments: {
              where: { month },
            },
            transactions: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
    });

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      categories: group.categories.map((category) => ({
        id: category.id,
        name: category.name,
        assigned: category.assignments[0]?.amount || 0,
        spent: category.transactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        ),
      })),
    }));

    return NextResponse.json({ groups: formattedGroups });
  } catch (error) {
    console.error("Budget fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}
