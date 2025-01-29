import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const category = await prisma.category.create({
    data: {
      name: body.name,
      icon: body.icon,
    },
  });

  return NextResponse.json(category);
}
