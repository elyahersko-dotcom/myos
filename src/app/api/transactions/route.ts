import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transactions = await prisma.transaction.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(body.amount),
      date: body.date ? new Date(body.date) : new Date(),
      description: body.description || null,
      category: body.category || "income",
      merchantName: body.merchantName || null,
      type: body.type || "income",
    },
  });
  return NextResponse.json(transaction);
}
