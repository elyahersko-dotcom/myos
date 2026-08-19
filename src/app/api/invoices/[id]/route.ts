import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fetches today's USD→CAD rate. Free, keyless API — good enough for
// "what did this come out to in CAD the day it was paid".
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if ("dueDate" in body) body.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if ("amount" in body) body.amount = parseFloat(body.amount);

  // The first time an invoice is marked paid, snapshot the payment date and
  // (for USD invoices) convert the amount to CAD using that day's rate.
  if (body.status === "paid") {
    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { currency: true, amount: true, paidAt: true },
    });
    if (existing && !existing.paidAt) {
      const amount = "amount" in body ? body.amount : existing.amount;
      const currency = existing.currency || "CAD";
      body.paidAt = new Date();
      if (currency === "USD") {
        const rate = await getUsdToCadRate();
        if (rate) {
          body.exchangeRate = rate;
          body.cadAmount = amount * rate;
        }
      } else {
        body.exchangeRate = 1;
        body.cadAmount = amount;
      }
    }
  }

  const invoice = await prisma.invoice.update({ where: { id: params.id }, data: body });
  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
