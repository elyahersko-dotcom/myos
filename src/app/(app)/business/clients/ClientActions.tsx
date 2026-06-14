"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500";

export default function ClientActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "", status: "active" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    setOpen(false);
    setForm({ company: "", name: "", email: "", phone: "", status: "active" });
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
        <Plus size={16} /> New Client
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-white mb-4">New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Company Name *</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} required className={inp} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Contact Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp}>
                  <option value="active">Active</option>
                  <option value="lead">Lead</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
