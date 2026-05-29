import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const event = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description || null,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime || body.startTime),
      allDay: body.allDay || false,
    },
  });
  return NextResponse.json(event);
}
