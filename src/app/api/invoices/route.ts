import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Find the next sequential global invoice number, e.g. INV-021
async function nextInvoiceNumber(): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { invoiceNumber: { not: null } },
    select: { invoiceNumber: true },
  });
  let max = 0;
  for (const { invoiceNumber } of invoices) {
    // Use the last number group in the string (handles INV-021, INV--021, INV-NAME-001)
    const m = invoiceNumber?.match(/(\d+)(?!.*\d)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `INV-${String(max + 1).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const invoice = await prisma.invoice.create({
    data: {
      clientId: body.clientId,
      projectId: body.projectId || null,
      invoiceNumber: body.invoiceNumber || (await nextInvoiceNumber()),
      amount: parseFloat(body.amount),
      status: body.status || "draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      lineItems: body.lineItems || [],
      notes: body.notes || null,
      paymentMethod: body.paymentMethod || null,
      paymentEmail: body.paymentEmail || null,
    },
  });
  return NextResponse.json(invoice);
}
