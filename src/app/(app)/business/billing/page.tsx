import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import InvoiceActions from "./InvoiceActions";
import ApplyToPersonal from "./ApplyToPersonal";
import { Printer } from "lucide-react";

const statusColor: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
};

export default async function BillingPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { company: "asc" } }),
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
              <th className="px-4 py-3 text-left font-medium">Invoice #</th>
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Due</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {inv.invoiceNumber || <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/business/clients/${inv.clientId}`} className="text-white hover:text-indigo-400 transition-colors font-medium">
                    {inv.client.company || inv.client.name}
                  </Link>
                  {inv.client.company && inv.client.name && (
                    <p className="text-xs text-gray-500 mt-0.5">{inv.client.name}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-white font-medium">${inv.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                  {inv.dueDate ? format(new Date(inv.dueDate), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <InvoiceActions clients={clients} invoice={inv} />
                    {inv.status === "paid" && (
                      <ApplyToPersonal
                        amount={inv.amount}
                        clientName={inv.client.company || inv.client.name}
                        invoiceNumber={inv.invoiceNumber}
                      />
                    )}
                    <Link
                      href={`/business/clients/${inv.clientId}/invoice/${inv.id}`}
                      target="_blank"
                      className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Print / Download PDF"
                    >
                      <Printer size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
