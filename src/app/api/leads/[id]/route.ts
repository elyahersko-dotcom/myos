import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.nextFollowUp) body.nextFollowUp = new Date(body.nextFollowUp);
  const lead = await prisma.lead.update({ where: { id: params.id }, data: body });
  return NextResponse.json(lead);
}
