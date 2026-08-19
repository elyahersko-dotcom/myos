"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  totalValue: number;
  owed: number;
  projectCount: number;
  _count: { tasks: number; invoices: number };
};

const fmt = (n: number) => "$" + n.toLocaleString();

export default function ClientList({ initialClients }: { initialClients: Client[] }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    await fetch(`/api/clients/${confirmId}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== confirmId));
    setConfirmId(null);
    setDeleting(false);
    router.refresh();
  }

  async function handleStatusChange(id: string, status: string) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const statusPillClass = (status: string) =>
    status === "active" ? "bg-green-900/50 text-green-400" :
    status === "lead" ? "bg-yellow-900/50 text-yellow-400" :
    status === "completed" ? "bg-blue-900/50 text-blue-400" :
    "bg-gray-800 text-gray-400";

  const confirmClient = clients.find((c) => c.id === confirmId);
  // Display label is always company if set, otherwise contact name
  const displayName = (c: Client) => c.company || c.name;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Projects</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Total Value</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Owed</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm">
                  No clients yet. Create your first client above.
                </td>
              </tr>
            )}
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-800/50 transition-colors group">
                <td className="px-4 py-3">
                  <Link href={`/business/clients/${client.id}`} className="text-white font-medium hover:text-indigo-400 transition-colors">
                    {displayName(client)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">{client.email || "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-sm text-right">{client.projectCount}</td>
                <td className="px-4 py-3 text-white text-sm text-right font-medium">{client.totalValue > 0 ? fmt(client.totalValue) : "—"}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${client.owed > 0 ? "text-orange-400" : "text-green-400"}`}>
                  {client.owed > 0 ? fmt(client.owed) : "✓ $0"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={client.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(client.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className={`appearance-none cursor-pointer inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${statusPillClass(client.status)}`}
                  >
                    <option value="active">active</option>
                    <option value="lead">lead</option>
                    <option value="completed">completed</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.preventDefault(); setConfirmId(client.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                    title="Delete client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-white">Delete Client</h2>
            <p className="text-gray-400 text-sm">
              Are you sure you want to delete <span className="text-white font-medium">{confirmClient ? (confirmClient.company || confirmClient.name) : ""}</span>?
              This will also delete all their projects, tasks, and invoices. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
