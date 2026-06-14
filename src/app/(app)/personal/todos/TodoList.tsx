"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, X, Check, Pencil, Trash2 } from "lucide-react";

type Todo = { id: string; title: string; notes: string | null; dueDate: Date | null; priority: string; status: string };

const priorityColor: Record<string, string> = {
  low: "border-l-gray-500", medium: "border-l-blue-500", high: "border-l-orange-500", urgent: "border-l-red-500"
};

const defaultForm = { title: "", notes: "", dueDate: "", priority: "medium" };

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [editLoading, setEditLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const todo = await res.json();
    setTodos([todo, ...todos]);
    setShowForm(false);
    setForm(defaultForm);
    setLoading(false);
  }

  async function toggleDone(id: string, current: string) {
    const status = current === "done" ? "todo" : "done";
    await fetch(`/api/todos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTodos(todos.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function openEdit(todo: Todo) {
    setEditingTodo(todo);
    setEditForm({
      title: todo.title,
      notes: todo.notes || "",
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : "",
      priority: todo.priority,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTodo) return;
    setEditLoading(true);
    const res = await fetch(`/api/todos/${editingTodo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t.id === editingTodo.id ? { ...t, ...updated } : t)));
    setEditingTodo(null);
    setEditLoading(false);
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    setTodos(todos.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  const active = todos.filter((t) => t.status !== "done");
  const done = todos.filter((t) => t.status === "done");

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={16} /> New Todo
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {active.map((todo) => (
          <div key={todo.id} className={`bg-gray-900 border border-gray-800 border-l-2 ${priorityColor[todo.priority]} rounded-xl px-4 py-3 flex items-start gap-3`}>
            <button onClick={() => toggleDone(todo.id, todo.status)} className="mt-0.5 w-5 h-5 rounded border border-gray-600 hover:border-indigo-500 flex items-center justify-center flex-shrink-0 transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{todo.title}</p>
              {todo.notes && <p className="text-gray-500 text-xs mt-0.5">{todo.notes}</p>}
              {deletingId === todo.id && (
                <div className="flex items-center gap-2 mt-2 bg-red-900/20 rounded-lg px-2 py-1.5">
                  <span className="text-xs text-red-400 flex-1">Delete?</span>
                  <button onClick={() => deleteTodo(todo.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Confirm</button>
                  <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                </div>
              )}
            </div>
            {todo.dueDate && <p className="text-xs text-gray-500 flex-shrink-0">{format(new Date(todo.dueDate), "MMM d")}</p>}
            <button onClick={() => openEdit(todo)} title="Edit"
              className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors flex-shrink-0">
              <Pencil size={13} />
            </button>
            <button onClick={() => setDeletingId(todo.id)} title="Delete"
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {active.length === 0 && <p className="text-center text-gray-500 text-sm py-8">All done! 🎉</p>}
      </div>

      {done.length > 0 && (
        <>
          <p className="text-xs text-gray-500 mb-2">Completed ({done.length})</p>
          <div className="space-y-2">
            {done.map((todo) => (
              <div key={todo.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3 flex items-start gap-3 opacity-60">
                <button onClick={() => toggleDone(todo.id, todo.status)} className="mt-0.5 w-5 h-5 rounded bg-indigo-600 border border-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </button>
                <p className="text-gray-400 text-sm line-through flex-1">{todo.title}</p>
                <button onClick={() => setDeletingId(todo.id)} title="Delete"
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0">
                  <Trash2 size={13} />
                </button>
                {deletingId === todo.id && (
                  <div className="flex items-center gap-2 bg-red-900/20 rounded-lg px-2 py-1.5">
                    <span className="text-xs text-red-400">Delete?</span>
                    <button onClick={() => deleteTodo(todo.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Confirm</button>
                    <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Todo</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={createTodo} className="space-y-3">
              <TodoFormFields form={form} setForm={setForm} />
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
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Edit Todo</h2>
              <button onClick={() => setEditingTodo(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <TodoFormFields form={editForm} setForm={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingTodo(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
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

function TodoFormFields({ form, setForm }: {
  form: typeof defaultForm;
  setForm: (f: typeof defaultForm) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Title *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
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
          <label className="block text-xs text-gray-400 mb-1">Due Date</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
    </>
  );
}
