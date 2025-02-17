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

export async function updateCategory(
  id: string,
  data: {
    name: string;
    icon: string;
  }
) {
  try {
    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
      },
    });

    revalidatePath("/budget");
  } catch (error) {
    throw error;
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if category has any transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new Error("Cannot delete category with existing transactions");
    }

    // Delete budget assignments first
    await prisma.budgetAssignment.deleteMany({
      where: { categoryId: id },
    });

    // Then delete the category
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/budget");
  } catch (error) {
    throw error;
  }
}

export async function updateCategoryGroup(
  id: string,
  data: {
    name: string;
  }
) {
  try {
    await prisma.categoryGroup.update({
      where: { id },
      data: {
        name: data.name,
      },
    });

    revalidatePath("/budget");
  } catch (error) {
    throw error;
  }
}

export async function deleteCategoryGroup(
  id: string,
  transferToGroupId?: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      if (transferToGroupId) {
        // Move all categories to the new group
        await tx.category.updateMany({
          where: { groupId: id },
          data: { groupId: transferToGroupId },
        });
      } else {
        // Check if any categories have transactions
        const categoriesWithTransactions = await tx.category.findMany({
          where: {
            groupId: id,
            transactions: { some: {} },
          },
        });

        if (categoriesWithTransactions.length > 0) {
          throw new Error(
            "Cannot delete group with categories that have transactions without specifying a transfer group"
          );
        }

        // Delete all budget assignments for categories in this group
        await tx.budgetAssignment.deleteMany({
          where: {
            category: { groupId: id },
          },
        });

        // Delete all categories in the group
        await tx.category.deleteMany({
          where: { groupId: id },
        });
      }

      // Finally, delete the group
      await tx.categoryGroup.delete({
        where: { id },
      });
    });

    revalidatePath("/budget");
  } catch (error) {
    throw error;
  }
}
