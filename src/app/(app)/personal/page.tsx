import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreditCard, BarChart2, Calendar, ListTodo, TrendingDown, TrendingUp } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default async function PersonalDashboard() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [payments, todos, events, monthlyTransactions] = await Promise.all([
    prisma.payment.findMany({ where: { isPaid: false }, orderBy: { dueDate: "asc" }, take: 5 }),
    prisma.todo.findMany({ where: { status: { not: "done" } }, orderBy: { dueDate: "asc" }, take: 5 }),
    prisma.calendarEvent.findMany({ where: { startTime: { gte: now } }, orderBy: { startTime: "asc" }, take: 5 }),
    prisma.transaction.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
  ]);

  const totalPaymentsDue = await prisma.payment.aggregate({ where: { isPaid: false }, _sum: { amount: true } });
  const income = monthlyTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthlyTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Personal</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/personal/payments" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-400/10"><CreditCard size={18} className="text-purple-400" /></div>
            <span className="text-sm text-gray-400">Bills Due</span>
          </div>
          <div className="text-2xl font-bold text-red-400">${(totalPaymentsDue._sum.amount || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{payments.length} upcoming</div>
        </Link>
        <Link href="/personal/bank" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-400/10"><TrendingUp size={18} className="text-emerald-400" /></div>
            <span className="text-sm text-gray-400">Income This Month</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">${income.toLocaleString()}</div>
        </Link>
        <Link href="/personal/bank" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-400/10"><TrendingDown size={18} className="text-red-400" /></div>
            <span className="text-sm text-gray-400">Expenses This Month</span>
          </div>
          <div className="text-2xl font-bold text-red-400">${expenses.toLocaleString()}</div>
        </Link>
        <Link href="/personal/todos" className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-400/10"><ListTodo size={18} className="text-blue-400" /></div>
            <span className="text-sm text-gray-400">Open Todos</span>
          </div>
          <div className="text-2xl font-bold text-white">{todos.length}</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Payments */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><CreditCard size={16} className="text-purple-400" /> Upcoming Bills</h2>
            <Link href="/personal/payments" className="text-xs text-gray-500 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {payments.length === 0 && <p className="text-gray-600 text-sm">No upcoming bills.</p>}
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <p className="text-sm text-white">{p.label}</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">${p.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{format(new Date(p.dueDate), "MMM d")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Todos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><ListTodo size={16} className="text-blue-400" /> Todos</h2>
            <Link href="/personal/todos" className="text-xs text-gray-500 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {todos.length === 0 && <p className="text-gray-600 text-sm">Nothing to do!</p>}
            {todos.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <p className="text-sm text-white flex-1">{t.title}</p>
                {t.dueDate && <p className="text-xs text-gray-500 flex-shrink-0">{format(new Date(t.dueDate), "MMM d")}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Calendar size={16} className="text-green-400" /> Upcoming Events</h2>
            <Link href="/personal/calendar" className="text-xs text-gray-500 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {events.length === 0 && <p className="text-gray-600 text-sm">No upcoming events.</p>}
            {events.map(ev => (
              <div key={ev.id} className="py-2 border-b border-gray-800 last:border-0">
                <p className="text-sm text-white">{ev.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{format(new Date(ev.startTime), "MMM d, h:mm a")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
