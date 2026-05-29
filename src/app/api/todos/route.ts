import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const todo = await prisma.todo.create({
    data: { ...body, dueDate: body.dueDate ? new Date(body.dueDate) : null },
  });
  return NextResponse.json(todo);
}
