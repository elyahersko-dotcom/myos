import { prisma } from "@/lib/prisma";
import KanbanBoard from "./KanbanBoard";

export default async function TasksPage() {
  const [tasks, clients] = await Promise.all([
    prisma.task.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Tasks</h1>
      <KanbanBoard initialTasks={tasks} clients={clients} />
    </div>
  );
}
