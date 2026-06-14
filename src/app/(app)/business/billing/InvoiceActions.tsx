"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Client = { id: string; name: string; company: string | null };
type Invoice = { id: string; clientId: string; amount: number; status: string; dueDate: Date | null };

const defaultForm = { clientId: "", amount: "", status: "draft", dueDate: "" };

export default function InvoiceActions({ clients, invoice }: { clients: Client[]; invoice?: Invoice }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(invoice ? {
    clientId: invoice.clientId,
    amount: String(invoice.amount),
    status: invoice.status,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
  } : defaultForm);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (invoice) {
      await fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
    } else {
      await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
    }
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  async function markPaid() {
    if (!invoice) return;
    await fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    router.refresh();
  }

  async function handleDelete() {
    if (!invoice) return;
    await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (invoice) {
    return (
      <div className="flex gap-2 items-center">
        {invoice.status !== "paid" && (
          <button onClick={markPaid} className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded px-2 py-1 transition-colors">Mark Paid</button>
        )}
        <button onClick={() => setOpen(true)} className="text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 rounded px-2 py-1 transition-colors">Edit</button>
        <button onClick={handleDelete} title="Delete" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
        {open && <Modal form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setOpen(false)} clients={clients} loading={loading} title="Edit Invoice" />}
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
        <Plus size={16} /> New Invoice
      </button>
      {open && <Modal form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setOpen(false)} clients={clients} loading={loading} title="New Invoice" />}
    </>
  );
}

function Modal({ form, setForm, onSubmit, onClose, clients, loading, title }: {
  form: typeof defaultForm; setForm: (f: typeof defaultForm) => void;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
  clients: Client[]; loading: boolean; title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Client *</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount *</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
              {["draft", "sent", "paid", "overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
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
