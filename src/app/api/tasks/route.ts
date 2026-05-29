import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: Record<string, unknown> = {
    title: body.title,
    description: body.description || null,
    priority: body.priority || "medium",
    status: body.status || "todo",
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    clientId: body.clientId || null,
  };
  const task = await prisma.task.create({ data: data as Parameters<typeof prisma.task.create>[0]["data"], include: { client: true } });
  return NextResponse.json(task);
}
