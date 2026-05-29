import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getContext() {
  const [clients, tasks, payments, todos] = await Promise.all([
    prisma.client.findMany({ take: 30 }),
    prisma.task.findMany({ include: { client: true }, take: 50, orderBy: { dueDate: "asc" } }),
    prisma.payment.findMany({ orderBy: { dueDate: "asc" } }),
    prisma.todo.findMany({ where: { status: "todo" }, take: 30 }),
  ]);
  return { clients, tasks, payments, todos };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const message = body.Body || "";

  const context = await getContext();

  const systemPrompt = `You are MyOS, a personal AI assistant. Data: clients=${JSON.stringify(context.clients.slice(0,10))}, tasks=${JSON.stringify(context.tasks.slice(0,20))}, payments=${JSON.stringify(context.payments)}, todos=${JSON.stringify(context.todos.slice(0,20))}. Today: ${new Date().toISOString()}. Keep responses concise for SMS/WhatsApp.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "Sorry, I couldn't process that.";

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
