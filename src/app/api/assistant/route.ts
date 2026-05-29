import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getContext() {
  const [clients, tasks, payments, todos, leads, transactions, events] = await Promise.all([
    prisma.client.findMany({ take: 50 }),
    prisma.task.findMany({ include: { client: true }, take: 100, orderBy: { dueDate: "asc" } }),
    prisma.payment.findMany({ orderBy: { dueDate: "asc" } }),
    prisma.todo.findMany({ where: { status: "todo" }, take: 50 }),
    prisma.lead.findMany({ take: 50 }),
    prisma.transaction.findMany({ take: 100, orderBy: { date: "desc" } }),
    prisma.calendarEvent.findMany({ take: 50, orderBy: { startTime: "asc" } }),
  ]);
  return { clients, tasks, payments, todos, leads, transactions, events };
}

async function executeActions(actions: { type: string; data: Record<string, unknown> }[]) {
  const results: string[] = [];
  for (const action of actions) {
    try {
      if (action.type === "create_task") {
        const task = await prisma.task.create({ data: action.data as Parameters<typeof prisma.task.create>[0]["data"] });
        results.push(`Created task: "${task.title}"`);
      } else if (action.type === "update_task") {
        const { id, ...data } = action.data as { id: string } & Record<string, unknown>;
        await prisma.task.update({ where: { id }, data });
        results.push(`Updated task ${id}`);
      } else if (action.type === "create_lead") {
        const lead = await prisma.lead.create({ data: action.data as Parameters<typeof prisma.lead.create>[0]["data"] });
        results.push(`Created lead: "${lead.name}"`);
      } else if (action.type === "create_todo") {
        const todo = await prisma.todo.create({ data: action.data as Parameters<typeof prisma.todo.create>[0]["data"] });
        results.push(`Created todo: "${todo.title}"`);
      } else if (action.type === "mark_payment_paid") {
        const { id } = action.data as { id: string };
        await prisma.payment.update({ where: { id }, data: { isPaid: true } });
        results.push(`Marked payment ${id} as paid`);
      } else if (action.type === "create_client") {
        const client = await prisma.client.create({ data: action.data as Parameters<typeof prisma.client.create>[0]["data"] });
        results.push(`Created client: "${client.name}"`);
      } else if (action.type === "create_event") {
        const event = await prisma.calendarEvent.create({ data: action.data as Parameters<typeof prisma.calendarEvent.create>[0]["data"] });
        results.push(`Created event: "${event.title}"`);
      }
    } catch (err) {
      results.push(`Failed: ${action.type} — ${String(err)}`);
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();

  await prisma.message.create({ data: { role: "user", content: message } });

  const context = await getContext();
  const history = await prisma.message.findMany({ orderBy: { createdAt: "asc" }, take: 20 });

  const systemPrompt = `You are MyOS, a personal AI assistant integrated into a personal operating system. You have access to all the user's data below.

Current Data:
- Clients (${context.clients.length}): ${JSON.stringify(context.clients.slice(0, 20))}
- Tasks (${context.tasks.length}): ${JSON.stringify(context.tasks.slice(0, 30))}
- Recurring Payments (${context.payments.length}): ${JSON.stringify(context.payments)}
- Todos (${context.todos.length}): ${JSON.stringify(context.todos)}
- Leads (${context.leads.length}): ${JSON.stringify(context.leads.slice(0, 20))}
- Recent Transactions (${context.transactions.length}): ${JSON.stringify(context.transactions.slice(0, 20))}
- Calendar Events (${context.events.length}): ${JSON.stringify(context.events.slice(0, 20))}
- Today: ${new Date().toISOString()}

You can take actions by including a JSON block at the end of your response with this exact format:
<actions>
[{"type": "create_task", "data": {"title": "...", "priority": "medium", "status": "todo", "dueDate": "2024-01-01T00:00:00Z"}},
{"type": "create_lead", "data": {"name": "...", "company": "...", "stage": "new"}},
{"type": "create_todo", "data": {"title": "...", "priority": "medium"}},
{"type": "create_client", "data": {"name": "...", "status": "active"}},
{"type": "create_event", "data": {"title": "...", "startTime": "...", "endTime": "...", "allDay": false}},
{"type": "mark_payment_paid", "data": {"id": "..."}},
{"type": "update_task", "data": {"id": "...", "status": "done"}}]
</actions>

Be helpful, concise, and proactive. If a user mentions adding something, do it. If they ask about data, answer with specifics.`;

  const messages: { role: "user" | "assistant"; content: string }[] = history.slice(-20).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const rawContent = response.content[0].type === "text" ? response.content[0].text : "";

  const actionsMatch = rawContent.match(/<actions>([\s\S]*?)<\/actions>/);
  let displayContent = rawContent.replace(/<actions>[\s\S]*?<\/actions>/g, "").trim();
  let actionResults: string[] = [];

  if (actionsMatch) {
    try {
      const actions = JSON.parse(actionsMatch[1]);
      actionResults = await executeActions(actions);
      if (actionResults.length > 0) {
        displayContent += "\n\n✓ " + actionResults.join("\n✓ ");
      }
    } catch {
      // malformed actions block — skip
    }
  }

  const saved = await prisma.message.create({ data: { role: "assistant", content: displayContent } });
  return NextResponse.json(saved);
}
