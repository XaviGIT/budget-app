"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addAccount(data: {
  name: string;
  balance: number;
  type: "CREDIT" | "DEBIT";
}) {
  try {
    const existing = await prisma.payee.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error("An account or payee with this name already exists");
    }

    await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: data.name,
          balance: data.balance,
          type: data.type,
        },
      });

      await tx.payee.create({
        data: {
          name: data.name,
          icon: data.name.split(" ")[0],
          accountId: account.id,
        },
      });
    });

    revalidatePath("/accounts");
  } catch (error) {
    throw error;
  }
}

export async function updateAccount(
  id: string,
  data: { name: string; balance: number; type: "CREDIT" | "DEBIT" }
) {
  try {
    const existing = await prisma.payee.findFirst({
      where: {
        name: data.name,
        NOT: { accountId: id },
      },
    });

    if (existing) {
      throw new Error("An account or payee with this name already exists");
    }

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id },
        data: {
          name: data.name,
          balance: data.balance,
          type: data.type,
        },
      });

      const payee = await tx.payee.findUnique({
        where: { accountId: id },
      });

      if (payee) {
        await tx.payee.update({
          where: { id: payee.id },
          data: {
            name: data.name,
            icon: data.name.split(" ")[0],
          },
        });
      } else {
        await tx.payee.create({
          data: {
            name: data.name,
            icon: data.name.split(" ")[0],
            accountId: id,
          },
        });
      }
    });

    revalidatePath("/accounts");
  } catch (error) {
    throw error;
  }
}

export async function deleteAccount(id: string, transferToAccountId?: string) {
  try {
    const transactionCount = await prisma.transaction.count({
      where: {
        OR: [{ accountId: id }, { payee: { accountId: id } }],
      },
    });

    await prisma.$transaction(async (tx) => {
      if (transactionCount > 0 && transferToAccountId) {
        // Update transactions to use new account
        await tx.transaction.updateMany({
          where: { accountId: id },
          data: { accountId: transferToAccountId },
        });

        // Update transactions where account was payee
        await tx.transaction.updateMany({
          where: {
            payee: { accountId: id },
          },
          data: {
            payeeId: (
              await tx.payee.findUnique({
                where: { accountId: transferToAccountId },
              })
            )?.id,
          },
        });
      } else if (transactionCount > 0) {
        throw new Error(
          "Cannot delete account with transactions without specifying transfer account"
        );
      }

      const payee = await tx.payee.findUnique({
        where: { accountId: id },
      });

      if (payee) {
        await tx.payee.delete({
          where: { id: payee.id },
        });
      }

      await tx.account.delete({
        where: { id },
      });
    });

    revalidatePath("/accounts");
  } catch (error) {
    throw error;
  }
}
