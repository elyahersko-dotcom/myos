import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const invoice = await prisma.invoice.create({
    data: {
      clientId: body.clientId,
      projectId: body.projectId || null,
      invoiceNumber: body.invoiceNumber || null,
      amount: parseFloat(body.amount),
      status: body.status || "draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      lineItems: body.lineItems || [],
      notes: body.notes || null,
    },
  });
  return NextResponse.json(invoice);
}
