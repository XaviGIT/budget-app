import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const existing = await prisma.payee.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account or payee with this name already exists" },
        { status: 400 }
      );
    }

    const account = await prisma.$transaction(async (tx) => {
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

      return account;
    });

    return NextResponse.json(account);
  } catch {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
