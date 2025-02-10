import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Extract id from params
  const id = params.id;

  try {
    const data = await request.json();

    const existing = await prisma.payee.findFirst({
      where: {
        name: data.name,
        NOT: { accountId: id }, // Use the extracted id
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account or payee with this name already exists" },
        { status: 400 }
      );
    }

    const account = await prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id }, // Use the extracted id
        data: {
          name: data.name,
          balance: data.balance,
          type: data.type,
        },
      });

      const payee = await tx.payee.findUnique({
        where: { accountId: id }, // Use the extracted id
      });

      if (payee) {
        await tx.payee.update({
          where: { id: payee.id },
          data: {
            name: data.name,
            icon: data.name.split(" ")[0],
          },
        });
      }

      return account;
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const data = await request.json();
    const { transferToAccountId } = data;

    const transactionCount = await prisma.transaction.count({
      where: {
        OR: [{ accountId: id }, { payee: { accountId: id } }],
      },
    });

    if (transactionCount > 0 && !transferToAccountId) {
      return NextResponse.json(
        {
          error:
            "Cannot delete account with transactions without specifying transfer account",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (transactionCount > 0 && transferToAccountId) {
        await tx.transaction.updateMany({
          where: { accountId: id },
          data: { accountId: transferToAccountId },
        });

        const newPayee = await tx.payee.findUnique({
          where: { accountId: transferToAccountId },
        });

        if (newPayee) {
          await tx.transaction.updateMany({
            where: {
              payee: { accountId: id },
            },
            data: {
              payeeId: newPayee.id,
            },
          });
        }
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
