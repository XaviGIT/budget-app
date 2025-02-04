import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
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
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
