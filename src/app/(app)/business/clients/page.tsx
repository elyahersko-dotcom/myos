import { prisma } from "@/lib/prisma";
import ClientActions from "./ClientActions";
import ClientList from "./ClientList";

export default async function ClientsPage() {
  const clientsRaw = await prisma.client.findMany({
    include: {
      _count: { select: { tasks: true, invoices: true } },
      projects: { select: { id: true, totalCost: true, status: true } },
      invoices: { select: { amount: true, status: true, projectId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Same math used everywhere else: total invoiced/paid, plus any project balance
  // that hasn't been invoiced yet — so "Owed" always matches the client hub page.
  const clients = clientsRaw.map(({ projects, invoices, ...c }) => {
    const totalValue = projects.reduce((s, p) => s + p.totalCost, 0);
    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const invoicedByProject = invoices.reduce((acc, i) => {
      if (i.projectId) acc[i.projectId] = (acc[i.projectId] || 0) + i.amount;
      return acc;
    }, {} as Record<string, number>);
    const uninvoicedProjectTotal = projects
      .filter(p => p.status !== "cancelled")
      .reduce((s, p) => s + Math.max(0, p.totalCost - (invoicedByProject[p.id] || 0)), 0);
    const owed = (totalInvoiced - totalPaid) + uninvoicedProjectTotal;
    return { ...c, totalValue, owed, projectCount: projects.length };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <ClientActions />
      </div>
      <ClientList initialClients={clients} />
    </div>
  );
}
