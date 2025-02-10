import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { month: string } }
) {
  try {
    const month = params.month;
    const startDate = new Date(month + "-01");
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

    // Get all categories with their groups
    const categories = await prisma.category.findMany({
      include: {
        group: true,
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
    });

    // Group by category group
    const groups = categories.reduce(
      (acc, category) => {
        const group = category.group;
        const groupIndex = acc.findIndex((g) => g.id === group.id);

        const assigned = category.assignments[0]?.amount || 0;
        const spent = category.transactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );

        const categoryData = {
          id: category.id,
          name: category.name,
          assigned,
          spent,
        };

        if (groupIndex === -1) {
          acc.push({
            id: group.id,
            name: group.name,
            categories: [categoryData],
          });
        } else {
          acc[groupIndex].categories.push(categoryData);
        }

        return acc;
      },
      [] as Array<{ id: string; name: string; categories: any[] }>
    );

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Budget fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}
