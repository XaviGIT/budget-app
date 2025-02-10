import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();

    const originalTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        payee: {
          include: { account: true },
        },
      },
    });

    if (!originalTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const amount = parseFloat(data.amount);
    const newPayee = await prisma.payee.findUnique({
      where: { id: data.payeeId },
      include: { account: true },
    });

    const transaction = await prisma.$transaction(async (tx) => {
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
        data: { balance: { decrement: amount } },
      });

      if (newPayee?.account) {
        await tx.account.update({
          where: { id: newPayee.account.id },
          data: { balance: { increment: amount } },
        });
      }

      // Update the transaction
      return await tx.transaction.update({
        where: { id },
        data: {
          date: new Date(data.date),
          accountId: data.accountId,
          payeeId: data.payeeId,
          categoryId: data.categoryId,
          amount: -amount,
          memo: data.memo || null,
          toAccountId: newPayee?.account?.id || null,
        },
        include: {
          account: {
            select: { name: true },
          },
          payee: {
            select: { name: true },
          },
          category: {
            select: { name: true },
          },
          toAccount: {
            select: { name: true },
          },
        },
      });
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        payee: {
          include: { account: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
