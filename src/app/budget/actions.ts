"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignToBudget(
  month: string,
  categoryId: string,
  amount: number
) {
  try {
    await prisma.budgetAssignment.upsert({
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

    revalidatePath("/budget");
  } catch (error) {
    throw error;
  }
}
