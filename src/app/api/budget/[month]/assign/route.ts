import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addMonths, format, parseISO } from "date-fns";

export async function POST(
  request: Request,
  { params }: { params: { month: string } }
) {
  try {
    const month = params.month;
    const body = await request.json();
    const { categoryId } = body;

    // Handle both old and new format requests
    if (!body.budgetConfig) {
      // Old format: direct amount assignment
      const amount = parseFloat(body.amount);

      await prisma.budgetAssignment.upsert({
        where: {
          month_categoryId: {
            month,
            categoryId,
          },
        },
        update: { amount },
        create: {
          month,
          categoryId,
          amount,
        },
      });

      return NextResponse.json({ success: true });
    }

    // New format with budget configuration
    const { type, amount, targetDate, targetAmount } = body.budgetConfig;

    // Store the budget configuration
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        budgetConfig: {
          type,
          amount,
          targetDate,
          targetAmount,
        },
      },
    });

    // Handle different budget types
    if (type === "custom") {
      // Single month assignment
      await prisma.budgetAssignment.upsert({
        where: {
          month_categoryId: {
            month,
            categoryId,
          },
        },
        update: { amount },
        create: {
          month,
          categoryId,
          amount,
        },
      });
    } else if (type === "monthly") {
      // Create/update assignments for all future months
      const currentDate = parseISO(month + "-01");
      const futureMonths = Array.from({ length: 12 }, (_, i) =>
        format(addMonths(currentDate, i), "yyyy-MM")
      );

      await Promise.all(
        futureMonths.map((futureMonth) =>
          prisma.budgetAssignment.upsert({
            where: {
              month_categoryId: {
                month: futureMonth,
                categoryId,
              },
            },
            update: { amount },
            create: {
              month: futureMonth,
              categoryId,
              amount,
            },
          })
        )
      );
    } else if (type === "target") {
      // Calculate and assign monthly amounts until target date
      const startDate = parseISO(month + "-01");
      const endDate = parseISO(targetDate);
      const monthsToTarget = Array.from(
        { length: Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) },
        (_, i) => format(addMonths(startDate, i), "yyyy-MM")
      );

      const monthlyAmount = Math.ceil(targetAmount / monthsToTarget.length);

      await Promise.all(
        monthsToTarget.map((targetMonth) =>
          prisma.budgetAssignment.upsert({
            where: {
              month_categoryId: {
                month: targetMonth,
                categoryId,
              },
            },
            update: { amount: monthlyAmount },
            create: {
              month: targetMonth,
              categoryId,
              amount: monthlyAmount,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Budget assignment error:", error);
    return NextResponse.json(
      { error: "Failed to save budget assignment" },
      { status: 500 }
    );
  }
}