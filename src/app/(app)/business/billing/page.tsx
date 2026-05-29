import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import InvoiceActions from "./InvoiceActions";

const statusColor: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
};

export default async function BillingPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <InvoiceActions clients={clients} />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Due</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-800/50">
                <td className="px-4 py-3 text-white">{inv.client.name}</td>
                <td className="px-4 py-3 text-white font-medium">${inv.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                  {inv.dueDate ? format(new Date(inv.dueDate), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <InvoiceActions clients={clients} invoice={inv} />
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
