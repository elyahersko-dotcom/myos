"use client";
import { useState } from "react";
import { ArrowDownLeft } from "lucide-react";

export default function ApplyToPersonal({
  amount,
  clientName,
  invoiceNumber,
}: {
  amount: number;
  clientName: string;
  invoiceNumber?: string | null;
}) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function apply() {
    if (done) return;
    setLoading(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        type: "income",
        category: "income",
        description: `${invoiceNumber ? invoiceNumber + " – " : ""}${clientName}`,
        date: new Date().toISOString(),
      }),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return <span className="text-xs text-emerald-400 font-medium">✓ Applied to Personal</span>;
  }

  return (
    <button
      onClick={apply}
      disabled={loading}
      className="flex items-center gap-1 text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded px-2 py-1 transition-colors disabled:opacity-50"
      title="Add this payment to personal income"
    >
      <ArrowDownLeft size={12} />
      {loading ? "Applying…" : "→ Personal"}
    </button>
  );
}
