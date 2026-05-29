import { prisma } from "@/lib/prisma";
import TodoList from "./TodoList";

export default async function TodosPage() {
  const todos = await prisma.todo.findMany({ orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }] });
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Todos</h1>
      <TodoList initialTodos={todos} />
    </div>
  );
}
