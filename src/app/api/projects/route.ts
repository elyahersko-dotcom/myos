import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      clientId: body.clientId,
      name: body.name,
      description: body.description || null,
      totalCost: parseFloat(body.totalCost),
      depositAmount: parseFloat(body.depositAmount || "0"),
      depositPaid: body.depositPaid || false,
      status: body.status || "active",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json(project);
}
