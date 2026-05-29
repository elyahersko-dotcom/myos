import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import BankDashboard from "./BankDashboard";

export default async function BankPage() {
  const now = new Date();
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });

  const monthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });

  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const categoryMap: Record<string, number> = {};
  monthTxns.filter((t) => t.type === "expense").forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Bank & Spending</h1>
      <BankDashboard transactions={transactions} income={income} expenses={expenses} categories={categories} />
    </div>
  );
}
