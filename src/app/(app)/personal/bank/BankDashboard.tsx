"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

type Transaction = {
  id: string; amount: number; date: Date; description: string | null;
  category: string; merchantName: string | null; type: string;
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

export default function BankDashboard({
  transactions: initialTransactions, income, expenses, categories,
}: {
  transactions: Transaction[]; income: number; expenses: number;
  categories: { name: string; value: number }[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteTransaction(id: string) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions(transactions.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">This Month Income</p>
          <p className="text-xl font-bold text-emerald-400">${income.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">This Month Expenses</p>
          <p className="text-xl font-bold text-red-400">${expenses.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Net</p>
          <p className={`text-xl font-bold ${income - expenses >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            ${(income - expenses).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{ name: "This Month", Income: income, Expenses: expenses }]}>
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Transactions</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 text-gray-400">
            <th className="px-4 py-3 text-left font-medium">Description</th>
            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Category</th>
            <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Date</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 w-10"></th>
          </tr></thead>
          <tbody>
            {transactions.slice(0, 50).map((t) => (
              <tr key={t.id} className="border-b border-gray-800/50 group">
                <td className="px-4 py-3 text-white">
                  <div>{t.merchantName || t.description || "—"}</div>
                  {t.merchantName && t.description && <div className="text-xs text-gray-500">{t.description}</div>}
                  {deletingId === t.id && (
                    <div className="flex items-center gap-2 mt-1 bg-red-900/20 rounded-lg px-2 py-1.5">
                      <span className="text-xs text-red-400 flex-1">Delete?</span>
                      <button onClick={() => deleteTransaction(t.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Confirm</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 capitalize hidden sm:table-cell">{t.category}</td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{format(new Date(t.date), "MMM d, yyyy")}</td>
                <td className={`px-4 py-3 text-right font-medium ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setDeletingId(t.id)} title="Delete"
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No transactions yet. Connect Plaid to sync.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
