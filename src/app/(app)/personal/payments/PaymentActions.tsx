"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Payment = { id: string; label: string; amount: number; dueDate: Date; recurrence: string; category: string; isPaid: boolean };

const defaultForm = { label: "", amount: "", dueDate: "", recurrence: "monthly", category: "other" };

export default function PaymentActions({ payment }: { payment?: Payment }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(payment ? {
    label: payment.label, amount: String(payment.amount),
    dueDate: new Date(payment.dueDate).toISOString().split("T")[0],
    recurrence: payment.recurrence, category: payment.category,
  } : defaultForm);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = { ...form, amount: parseFloat(form.amount) };
    if (payment) {
      await fetch(`/api/payments/${payment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  async function togglePaid() {
    if (!payment) return;
    await fetch(`/api/payments/${payment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPaid: !payment.isPaid }) });
    router.refresh();
  }

  async function handleDelete() {
    if (!payment) return;
    await fetch(`/api/payments/${payment.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (payment) {
    return (
      <div className="flex gap-2 items-center">
        <button onClick={togglePaid} className={`text-xs rounded px-2 py-1 transition-colors ${payment.isPaid ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-green-600/20 text-green-400 hover:bg-green-600/30"}`}>
          {payment.isPaid ? "Undo" : "Mark Paid"}
        </button>
        <button onClick={() => setOpen(true)} className="text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 rounded px-2 py-1 transition-colors">Edit</button>
        <button onClick={handleDelete} title="Delete" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
        {open && <Modal form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setOpen(false)} loading={loading} title="Edit Payment" />}
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
        <Plus size={16} /> New Payment
      </button>
      {open && <Modal form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setOpen(false)} loading={loading} title="New Payment" />}
    </>
  );
}

function Modal({ form, setForm, onSubmit, onClose, loading, title }: {
  form: typeof defaultForm; setForm: (f: typeof defaultForm) => void;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
  loading: boolean; title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Label *</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount *</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Due Date *</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Recurrence</label>
              <select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                {["monthly", "yearly", "once"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                {["rent", "car", "utilities", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
