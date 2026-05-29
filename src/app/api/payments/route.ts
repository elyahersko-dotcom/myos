import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const payment = await prisma.payment.create({
    data: { ...body, dueDate: new Date(body.dueDate), amount: parseFloat(body.amount) },
  });
  return NextResponse.json(payment);
}
