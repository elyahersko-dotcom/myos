import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId, amount, status, dueDate, lineItems } = await req.json();
  const invoice = await prisma.invoice.create({
    data: { clientId, amount: parseFloat(amount), status: status || "draft", dueDate: dueDate ? new Date(dueDate) : null, lineItems: lineItems || [] },
  });
  return NextResponse.json(invoice);
}
