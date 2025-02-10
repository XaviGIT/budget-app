"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addTransaction(data: {
  date: string;
  accountId: string;
  payeeId: string;
  categoryId: string;
  amount: string;
  memo: string;
}) {
  try {
    const sourceAccount = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    const targetPayee = await prisma.payee.findUnique({
      where: { id: data.payeeId },
      include: { account: true },
    });

    if (!sourceAccount) {
      throw new Error("Source account not found");
    }

    const amount = parseFloat(data.amount);

    await prisma.$transaction(async (tx) => {
      // Create the transaction
      await tx.transaction.create({
        data: {
          date: new Date(data.date),
          accountId: data.accountId,
          payeeId: data.payeeId,
          categoryId: data.categoryId,
          amount: -amount, // Negative for outflow
          memo: data.memo || null,
          toAccountId: targetPayee?.account?.id || null,
        },
      });

      // Update source account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: amount } },
      });

      // If this is a transfer, update target account balance
      if (targetPayee?.account) {
        await tx.account.update({
          where: { id: targetPayee.account.id },
          data: { balance: { increment: amount } },
        });
      }
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
  } catch (error) {
    throw error;
  }
}

export async function updateTransaction(
  id: string,
  data: {
    date: string;
    accountId: string;
    payeeId: string;
    categoryId: string;
    amount: string;
    memo: string;
  }
) {
  try {
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        payee: {
          include: { account: true },
        },
      },
    });

    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }

    const newAmount = parseFloat(data.amount);
    const newPayee = await prisma.payee.findUnique({
      where: { id: data.payeeId },
      include: { account: true },
    });

    await prisma.$transaction(async (tx) => {
      // Revert original transaction effects
      await tx.account.update({
        where: { id: originalTransaction.accountId },
        data: { balance: { increment: originalTransaction.amount } },
      });

      if (originalTransaction.toAccountId) {
        await tx.account.update({
          where: { id: originalTransaction.toAccountId },
          data: { balance: { decrement: originalTransaction.amount } },
        });
      }

      // Apply new transaction effects
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: newAmount } },
      });

      if (newPayee?.account) {
        await tx.account.update({
          where: { id: newPayee.account.id },
          data: { balance: { increment: newAmount } },
        });
      }

      // Update the transaction
      await tx.transaction.update({
        where: { id },
        data: {
          date: new Date(data.date),
          accountId: data.accountId,
          payeeId: data.payeeId,
          categoryId: data.categoryId,
          amount: -newAmount,
          memo: data.memo || null,
          toAccountId: newPayee?.account?.id || null,
        },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
  } catch (error) {
    throw error;
  }
}

export async function deleteTransaction(id: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        payee: {
          include: { account: true },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await prisma.$transaction(async (tx) => {
      // Revert transaction effects
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: transaction.amount } },
      });

      if (transaction.toAccountId) {
        await tx.account.update({
          where: { id: transaction.toAccountId },
          data: { balance: { decrement: transaction.amount } },
        });
      }

      // Delete the transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
  } catch (error) {
    throw error;
  }
}
