"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

type Task = {
  id: string; title: string; description: string | null; dueDate: Date | null;
  priority: string; status: string; clientId: string | null;
  client: { id: string; name: string } | null;
};
type Client = { id: string; name: string };

const columns = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const priorityColor: Record<string, string> = {
  low: "text-gray-400", medium: "text-blue-400", high: "text-orange-400", urgent: "text-red-400"
};

const defaultForm = { title: "", description: "", dueDate: "", priority: "medium", status: "todo", clientId: "" };

export default function KanbanBoard({ initialTasks, clients }: { initialTasks: Task[]; clients: Client[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filterClient, setFilterClient] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = tasks.filter((t) => {
    if (filterClient && t.clientId !== filterClient) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const task = await res.json();
    setTasks([task, ...tasks]);
    setShowForm(false);
    setForm(defaultForm);
    setLoading(false);
  }

  async function moveTask(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      priority: task.priority,
      status: task.status,
      clientId: task.clientId || "",
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask) return;
    setEditLoading(true);
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setTasks(tasks.map((t) => (t.id === editingTask.id ? { ...t, ...updated, client: t.client } : t)));
    setEditingTask(null);
    setEditLoading(false);
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
          <option value="">All Priorities</option>
          {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm">{col.label}</h3>
                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-white text-sm font-medium flex-1 min-w-0">{task.title}</p>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => openEdit(task)} title="Edit"
                          className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeletingId(task.id)} title="Delete"
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {task.client && <p className="text-xs text-gray-500 mb-2">{task.client.name}</p>}
                    {deletingId === task.id && (
                      <div className="flex items-center gap-2 mb-2 bg-red-900/20 rounded-lg px-2 py-1.5">
                        <span className="text-xs text-red-400 flex-1">Delete?</span>
                        <button onClick={() => deleteTask(task.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Confirm</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs capitalize ${priorityColor[task.priority]}`}>{task.priority}</span>
                      {task.dueDate && <span className="text-xs text-gray-500 ml-auto">{format(new Date(task.dueDate), "MMM d")}</span>}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {columns.filter((c) => c.key !== col.key).map((c) => (
                        <button key={c.key} onClick={() => moveTask(task.id, c.key)}
                          className="text-xs text-gray-500 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-2 py-0.5 transition-colors">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <p className="text-gray-600 text-xs text-center py-4">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Task</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={createTask} className="space-y-3">
              <TaskFormFields form={form} setForm={setForm} clients={clients} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Edit Task</h2>
              <button onClick={() => setEditingTask(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <TaskFormFields form={editForm} setForm={setEditForm} clients={clients} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingTask(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={editLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {editLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFormFields({ form, setForm, clients }: {
  form: { title: string; description: string; dueDate: string; priority: string; status: string; clientId: string };
  setForm: (f: typeof form) => void;
  clients: { id: string; name: string }[];
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Title *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
            {["todo", "in-progress", "done"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Due Date</label>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Client</label>
        <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
          <option value="">No client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    </>
  );
}
