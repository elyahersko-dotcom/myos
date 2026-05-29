import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const lead = await prisma.lead.create({
    data: { ...body, nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null },
  });
  return NextResponse.json(lead);
}
