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

    const targetPayee = await prisma.payee.findUnique({
      where: { id: data.payeeId },
      include: { account: true },
    });

    // Determine transaction type
    const isTransfer = !!targetPayee?.account;
    const isIncome = data.transactionType === "income"; // Add this field to your form

    const amount = parseFloat(data.amount);

    const transaction = await prisma.$transaction(async (tx) => {
      const amountValue = isIncome ? amount : -amount;

      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          date: new Date(data.date),
          accountId: data.accountId,
          payeeId: data.payeeId,
          categoryId: isTransfer || isIncome ? null : data.categoryId, // Optional for income too
          amount: amountValue,
          memo: data.memo || null,
          toAccountId: isTransfer ? targetPayee?.account?.id : null,
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

      // Update account balance correctly based on transaction type
      if (isIncome) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: amount } },
        });
      } else if (isTransfer) {
        // Handle transfer (as you already do)
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: amount } },
        });

        if (targetPayee?.account) {
          await tx.account.update({
            where: { id: targetPayee.account.id },
            data: { balance: { increment: amount } },
          });
        }
      } else {
        // Normal expense
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: amount } },
        });
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
