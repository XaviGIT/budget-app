import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort");
    const filters = Object.fromEntries(
      Array.from(searchParams.entries()).filter(([key]) =>
        key.startsWith("filter_")
      )
    );

    // Build where clause based on filters
    const where = Object.entries(filters).reduce((acc, [key, value]) => {
      const field = key.replace("filter_", "");
      if (!value) return acc;

      switch (field) {
        case "date":
          return {
            ...acc,
            date: {
              gte: new Date(value),
              lt: new Date(
                new Date(value).setDate(new Date(value).getDate() + 1)
              ),
            },
          };
        case "amount":
          return {
            ...acc,
            amount: parseFloat(value),
          };
        case "account":
          return {
            ...acc,
            account: {
              name: {
                contains: value,
                mode: "insensitive",
              },
            },
          };
        case "payee":
          return {
            ...acc,
            payee: {
              name: {
                contains: value,
                mode: "insensitive",
              },
            },
          };
        case "category":
          return {
            ...acc,
            category: {
              name: {
                contains: value,
                mode: "insensitive",
              },
            },
          };
        case "memo":
          return {
            ...acc,
            memo: {
              contains: value,
              mode: "insensitive",
            },
          };
        default:
          return acc;
      }
    }, {});

    // Build orderBy based on sort parameter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any[] = [{ date: "desc" }];
    if (sort) {
      const [field, direction] = sort.split("_") as [string, "asc" | "desc"];

      switch (field) {
        case "date":
          orderBy = [{ date: direction }];
          break;
        case "amount":
          orderBy = [{ amount: direction }];
          break;
        case "account":
          orderBy = [{ account: { name: direction } }];
          break;
        case "payee":
          orderBy = [{ payee: { name: direction } }];
          break;
        case "category":
          orderBy = [{ category: { name: direction } }];
          break;
        case "memo":
          orderBy = [{ memo: direction }];
          break;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
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

    // Format dates and add computed fields
    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      formattedDate: transaction.date.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const sourceAccount = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    const targetPayee = await prisma.payee.findUnique({
      where: { id: data.payeeId },
      include: { account: true },
    });

    if (!sourceAccount) {
      return NextResponse.json(
        { error: "Source account not found" },
        { status: 400 }
      );
    }

    const amount = parseFloat(data.amount);

    const isTransfer = !!targetPayee?.account;

    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          date: new Date(data.date),
          accountId: data.accountId,
          payeeId: data.payeeId,
          categoryId: isTransfer ? null : data.categoryId,
          amount: -amount, // Negative for outflow
          memo: data.memo || null,
          toAccountId: targetPayee?.account?.id || null,
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

      // Update source account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: amount } },
      });

      // If this is a transfer, update target account balance
      if (targetPayee?.account) {
        // Handle differently based on account type
        if (targetPayee.account.type === "CREDIT") {
          // For credit accounts, decreasing balance means reducing debt
          await tx.account.update({
            where: { id: targetPayee.account.id },
            data: { balance: { decrement: amount } },
          });
        } else {
          // For regular accounts, increase the balance
          await tx.account.update({
            where: { id: targetPayee.account.id },
            data: { balance: { increment: amount } },
          });
        }
      }

      return transaction;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
