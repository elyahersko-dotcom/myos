import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const client = await prisma.client.update({ where: { id: params.id }, data: body });
  return NextResponse.json(client);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Delete related records first
  await prisma.invoice.deleteMany({ where: { clientId: params.id } });
  await prisma.task.deleteMany({ where: { clientId: params.id } });
  await prisma.project.deleteMany({ where: { clientId: params.id } });
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
