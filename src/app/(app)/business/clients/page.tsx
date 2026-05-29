import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientActions from "./ClientActions";

const statusColor: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  lead: "bg-yellow-500/20 text-yellow-400",
  inactive: "bg-gray-500/20 text-gray-400",
};

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { tasks: true, invoices: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <ClientActions />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Company</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Tasks</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Invoices</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/business/clients/${client.id}`} className="text-white hover:text-indigo-400 font-medium">
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{client.company || "—"}</td>
                <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{client.email || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[client.status] || statusColor.inactive}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{client._count.tasks}</td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{client._count.invoices}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No clients yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
