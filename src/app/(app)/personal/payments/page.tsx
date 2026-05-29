import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import PaymentActions from "./PaymentActions";

const categoryColor: Record<string, string> = {
  rent: "bg-blue-500/20 text-blue-400",
  car: "bg-purple-500/20 text-purple-400",
  utilities: "bg-yellow-500/20 text-yellow-400",
  other: "bg-gray-500/20 text-gray-400",
};

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({ orderBy: { dueDate: "asc" } });

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const paid = payments.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Recurring Payments</h1>
        <PaymentActions />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Monthly</p>
          <p className="text-xl font-bold text-white">${total.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Paid This Period</p>
          <p className="text-xl font-bold text-green-400">${paid.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Due</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Recurrence</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-800/50">
                <td className="px-4 py-3 text-white">{payment.label}</td>
                <td className="px-4 py-3 text-white font-medium">${payment.amount.toLocaleString()}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColor[payment.category] || categoryColor.other}`}>{payment.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{format(new Date(payment.dueDate), "MMM d, yyyy")}</td>
                <td className="px-4 py-3 text-gray-400 capitalize hidden md:table-cell">{payment.recurrence}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${payment.isPaid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {payment.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PaymentActions payment={payment} />
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No payments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
