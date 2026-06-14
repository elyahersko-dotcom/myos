import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, CheckSquare, FileText, TrendingUp, DollarSign, Clock } from "lucide-react";
import { startOfDay, endOfDay } from "date-fns";

export default async function BusinessDashboard() {
  const now = new Date();

  const [, tasks, invoices, projects, leads] = await Promise.all([
    prisma.client.findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.task.findMany({ where: { status: { not: "done" } }, orderBy: { dueDate: "asc" }, take: 5 }),
    prisma.invoice.findMany({ where: { status: { not: "paid" } }, include: { client: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.project.findMany({ where: { status: "active" }, include: { client: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.lead.count({ where: { stage: { in: ["new", "contacted"] } } }),
  ]);

  const totalClients = await prisma.client.count({ where: { status: "active" } });
  const tasksDueToday = await prisma.task.count({ where: { dueDate: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "done" } } });

  // Outstanding = all unpaid invoices + uninvoiced project balances
  const allUnpaidInvoices = await prisma.invoice.findMany({ where: { status: { not: "paid" } } });
  const allProjects = await prisma.project.findMany({ where: { status: { not: "cancelled" } }, include: { invoices: true } });
  const unpaidTotal = allUnpaidInvoices.reduce((s, i) => s + i.amount, 0);
  const uninvoicedTotal = allProjects.reduce((s, p) => {
    const invoiced = p.invoices.reduce((a, i) => a + i.amount, 0);
    return s + Math.max(0, p.totalCost - invoiced);
  }, 0);
  const outstanding = unpaidTotal + uninvoicedTotal;

  const statusColor: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400",
    sent: "bg-blue-500/20 text-blue-400",
    overdue: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Business</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/business/clients" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-indigo-400/10"><Users size={18} className="text-indigo-400" /></div>
            <span className="text-sm text-gray-400">Active Clients</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalClients}</div>
        </Link>
        <Link href="/business/billing" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-400/10"><DollarSign size={18} className="text-orange-400" /></div>
            <span className="text-sm text-gray-400">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">${outstanding.toLocaleString()}</div>
        </Link>
        <Link href="/business/tasks" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-400/10"><CheckSquare size={18} className="text-blue-400" /></div>
            <span className="text-sm text-gray-400">Tasks Due Today</span>
          </div>
          <div className="text-2xl font-bold text-white">{tasksDueToday}</div>
        </Link>
        <Link href="/business/sales" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-400/10"><TrendingUp size={18} className="text-green-400" /></div>
            <span className="text-sm text-gray-400">Active Leads</span>
          </div>
          <div className="text-2xl font-bold text-white">{leads}</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Unpaid Invoices */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><FileText size={16} className="text-orange-400" /> Unpaid Invoices</h2>
            <Link href="/business/billing" className="text-xs text-gray-500 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {invoices.length === 0 && <p className="text-gray-600 text-sm">All clear — no unpaid invoices.</p>}
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <Link href={`/business/clients/${inv.clientId}`} className="text-sm text-white hover:text-indigo-400 font-medium">
                    {inv.client.company || inv.client.name}
                  </Link>
                  {inv.invoiceNumber && <p className="text-xs text-gray-500">{inv.invoiceNumber}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">${inv.amount.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[inv.status] || "bg-gray-700 text-gray-400"}`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><CheckSquare size={16} className="text-blue-400" /> Open Tasks</h2>
            <Link href="/business/tasks" className="text-xs text-gray-500 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-gray-600 text-sm">No open tasks.</p>}
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <p className="text-sm text-white">{task.title}</p>
                <div className="flex items-center gap-2">
                  {task.dueDate && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <span className={`text-xs capitalize ${task.priority === "urgent" ? "text-red-400" : task.priority === "high" ? "text-orange-400" : "text-gray-500"}`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-indigo-400" /> Active Projects</h2>
            <Link href="/business/clients" className="text-xs text-gray-500 hover:text-white">View clients</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.length === 0 && <p className="text-gray-600 text-sm">No active projects.</p>}
            {projects.map(p => (
              <Link key={p.id} href={`/business/clients/${p.clientId}`} className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.client.company || p.client.name}</p>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-500">Total</span>
                  <span className="text-white font-medium">${p.totalCost.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
