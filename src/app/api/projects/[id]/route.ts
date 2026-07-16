import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if ("startDate" in body) body.startDate = body.startDate ? new Date(body.startDate) : null;
  if ("endDate" in body) body.endDate = body.endDate ? new Date(body.endDate) : null;
  if ("totalCost" in body) body.totalCost = parseFloat(body.totalCost);
  if ("depositAmount" in body) body.depositAmount = parseFloat(body.depositAmount || "0");
  const project = await prisma.project.update({ where: { id: params.id }, data: body });
  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
