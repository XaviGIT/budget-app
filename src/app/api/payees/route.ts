import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const payees = await prisma.payee.findMany({
      orderBy: { name: "asc" },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(payees);
  } catch (error) {
    console.error("Error fetching payees:", error);
    return NextResponse.json(
      { error: "Failed to fetch payees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const payee = await prisma.payee.create({
      data: {
        name: data.name,
        icon: data.icon,
        accountId: data.accountId || null,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(payee);
  } catch (error) {
    console.error("Error creating payee:", error);
    return NextResponse.json(
      { error: "Failed to create payee" },
      { status: 500 }
    );
  }
}
