import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";

const priorityColor: Record<string, string> = {
  low: "text-gray-400", medium: "text-blue-400", high: "text-orange-400", urgent: "text-red-400"
};
const statusColor: Record<string, string> = {
  todo: "bg-gray-500/20 text-gray-400", "in-progress": "bg-blue-500/20 text-blue-400", done: "bg-green-500/20 text-green-400"
};
const invoiceStatusColor: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400", sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400", overdue: "bg-red-500/20 text-red-400"
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      tasks: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/business/clients" className="text-sm text-gray-500 hover:text-white">← Clients</Link>
        <h1 className="text-2xl font-bold text-white mt-2">{client.name}</h1>
        {client.company && <p className="text-gray-400">{client.company}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[["Email", client.email], ["Phone", client.phone], ["Status", client.status]].map(([k, v]) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{k}</p>
            <p className="text-white">{v || "—"}</p>
          </div>
        ))}
        {client.notes && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:col-span-2">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-white whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Tasks</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        {client.tasks.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">No tasks for this client.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Due</th>
            </tr></thead>
            <tbody>
              {client.tasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-white">{task.title}</td>
                  <td className={`px-4 py-3 capitalize ${priorityColor[task.priority]}`}>{task.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[task.status]}`}>{task.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Invoices</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {client.invoices.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">No invoices for this client.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Due</th>
            </tr></thead>
            <tbody>
              {client.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-white font-medium">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${invoiceStatusColor[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {inv.dueDate ? format(inv.dueDate, "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
