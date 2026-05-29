import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { CheckSquare, CreditCard, FileText, TrendingUp, DollarSign } from "lucide-react";

async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [tasksDueToday, upcomingPayments, outstandingInvoices, newLeads, monthlyTransactions] =
    await Promise.all([
      prisma.task.count({
        where: { dueDate: { gte: todayStart, lte: todayEnd }, status: { not: "done" } },
      }),
      prisma.payment.count({ where: { isPaid: false, dueDate: { gte: now } } }),
      prisma.invoice.findMany({ where: { status: { in: ["sent", "overdue"] } } }),
      prisma.lead.count({ where: { stage: "new" } }),
      prisma.transaction.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

  const income = monthlyTransactions
    .filter((t: { type: string }) => t.type === "income")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const expenses = monthlyTransactions
    .filter((t: { type: string }) => t.type === "expense")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const outstandingTotal = outstandingInvoices.reduce((s: number, i: { amount: number }) => s + i.amount, 0);

  return { tasksDueToday, upcomingPayments, outstandingCount: outstandingInvoices.length, outstandingTotal, newLeads, income, expenses };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const cards = [
    {
      label: "Tasks Due Today",
      value: data.tasksDueToday,
      icon: CheckSquare,
      href: "/business/tasks",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Upcoming Payments",
      value: data.upcomingPayments,
      icon: CreditCard,
      href: "/personal/payments",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Outstanding Invoices",
      value: `$${data.outstandingTotal.toLocaleString()}`,
      sub: `${data.outstandingCount} invoice${data.outstandingCount !== 1 ? "s" : ""}`,
      icon: FileText,
      href: "/business/billing",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      label: "New Leads",
      value: data.newLeads,
      icon: TrendingUp,
      href: "/business/sales",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "This Month — Income",
      value: `$${data.income.toLocaleString()}`,
      icon: DollarSign,
      href: "/personal/bank",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "This Month — Expenses",
      value: `$${data.expenses.toLocaleString()}`,
      icon: DollarSign,
      href: "/personal/bank",
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon size={18} className={card.color} />
              </div>
              <span className="text-sm text-gray-400">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            {card.sub && <div className="text-xs text-gray-500 mt-1">{card.sub}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
