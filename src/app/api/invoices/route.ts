import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getUsdToCadRate(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.CAD;
    return typeof rate === "number" ? rate : null;
  } catch {
    return null;
  }
}

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
  // Snapshot the client's current currency onto the invoice, so it stays
  // correct even if the client's currency preference changes later.
  const client = await prisma.client.findUnique({ where: { id: body.clientId }, select: { currency: true } });
  const currency = client?.currency || "CAD";
  const amount = parseFloat(body.amount);
  const status = body.status || "draft";

  let paidAt: Date | null = null;
  let exchangeRate: number | null = null;
  let cadAmount: number | null = null;
  if (status === "paid") {
    paidAt = new Date();
    if (currency === "USD") {
      const rate = await getUsdToCadRate();
      if (rate) { exchangeRate = rate; cadAmount = amount * rate; }
    } else {
      exchangeRate = 1;
      cadAmount = amount;
    }
  }

  const invoice = await prisma.invoice.create({
    data: {
      clientId: body.clientId,
      projectId: body.projectId || null,
      invoiceNumber: body.invoiceNumber || (await nextInvoiceNumber()),
      amount,
      status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      lineItems: body.lineItems || [],
      paymentSchedule: body.paymentSchedule || [],
      notes: body.notes || null,
      paymentMethod: body.paymentMethod || null,
      paymentEmail: body.paymentEmail || null,
      currency,
      paidAt,
      exchangeRate,
      cadAmount,
    },
  });
  return NextResponse.json(invoice);
}
