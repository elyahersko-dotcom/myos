"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Printer, X, Plus, Check } from "lucide-react";

type LineItem = { description: string; quantity: string; unitPrice: string };
type Invoice = {
  id: string; invoiceNumber: string | null; amount: number; status: string;
  dueDate: string | null; createdAt: string; lineItems: LineItem[];
  notes: string | null; paymentMethod: string | null; paymentEmail: string | null;
};
type ClientInfo = { name: string; company: string | null; email: string | null; phone: string | null; address: string | null };
type ProjectInfo = { name: string; totalCost: number; depositAmount: number; endDate: string | null };
type BizInfo = { businessName: string | null; businessTagline: string | null; businessEmail: string | null; businessPhone: string | null; businessAddress: string | null };

const fmt = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2 });
const accent = "#00E5CC";
const inputCls = "w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#00b3a0]";

export default function InvoiceView({
  clientId, invoice, client, project, biz, previouslyInvoiced,
}: {
  clientId: string; invoice: Invoice; client: ClientInfo; project: ProjectInfo | null;
  biz: BizInfo | null; previouslyInvoiced: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(invoice);
  const [form, setForm] = useState({
    invoiceNumber: invoice.invoiceNumber || "",
    dueDate: invoice.dueDate ? invoice.dueDate.split("T")[0] : "",
    status: invoice.status,
    notes: invoice.notes || "",
    paymentMethod: invoice.paymentMethod || "",
    paymentEmail: invoice.paymentEmail || "",
    lineItems: invoice.lineItems.length > 0 ? invoice.lineItems : [{ description: "Services rendered", quantity: "1", unitPrice: String(invoice.amount) }],
  });

  const dueNow = form.lineItems.reduce((s, li) => s + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0);
  const balanceDue = project ? Math.max(0, project.totalCost - previouslyInvoiced - dueNow) : null;
  const balanceDueWhen = project?.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "Upon completion";

  async function save() {
    setSaving(true);
    const lineItems = form.lineItems.filter(li => li.description);
    const amount = lineItems.reduce((s, li) => s + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0);
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: form.invoiceNumber || null,
        dueDate: form.dueDate || null,
        status: form.status,
        notes: form.notes || null,
        paymentMethod: form.paymentMethod || null,
        paymentEmail: form.paymentEmail || null,
        lineItems,
        amount,
      }),
    });
    setSaving(false);
    if (!res.ok) { alert("Failed to save invoice."); return; }
    const updated = await res.json();
    setSaved({ ...saved, ...updated, dueDate: updated.dueDate, lineItems });
    setEditing(false);
  }

  const displayLineItems = editing ? form.lineItems : (saved.lineItems.length > 0 ? saved.lineItems : [{ description: "Services rendered", quantity: "1", unitPrice: String(saved.amount) }]);
  const displayDueNow = editing ? dueNow : saved.amount;

  return (
    <>
      {/* Toolbar */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        <a href={`/business/clients/${clientId}`} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium">
          ← Back
        </a>
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#00b3a0] hover:bg-[#0a9e90] disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              <Check size={15} /> {saving ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">
              <Pencil size={15} /> Edit
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-[#00b3a0] hover:bg-[#0a9e90] text-white rounded-lg text-sm font-medium">
              <Printer size={15} /> Print / Save PDF
            </button>
          </>
        )}
      </div>

      <div className="invoice-page min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
        <div className="invoice-sheet mx-auto max-w-3xl bg-white shadow-xl print:shadow-none">
          <div className="p-10 md:p-14">

            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <svg width="150" height="52" viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg" className="-ml-1">
                  <rect x="8" y="12" width="4" height="30" rx="1.5" fill={accent} />
                  <rect x="8" y="12" width="20" height="4" rx="1.5" fill={accent} />
                  <rect x="8" y="38" width="20" height="4" rx="1.5" fill={accent} />
                  <rect x="24" y="12" width="4" height="13" rx="1.5" fill={accent} />
                  <rect x="24" y="29" width="4" height="13" rx="1.5" fill={accent} />
                  <text x="42" y="36" fontSize="22" fontWeight="700" fill="#0a0c12" fontFamily="system-ui,sans-serif" letterSpacing="-0.5">Deer</text>
                  <text x="96" y="36" fontSize="22" fontWeight="700" fill={accent} fontFamily="system-ui,sans-serif" letterSpacing="-0.5">Co</text>
                  <text x="43" y="52" fontSize="8" fill="#4a5568" fontFamily="system-ui,sans-serif" letterSpacing="4">SOLUTIONS</text>
                </svg>
                {biz?.businessName && <p className="font-semibold text-gray-900 mt-2">{biz.businessName}</p>}
                <div className="text-sm text-gray-500 leading-relaxed">
                  {biz?.businessAddress && <p className="whitespace-pre-line">{biz.businessAddress}</p>}
                  {biz?.businessEmail && <p>{biz.businessEmail}</p>}
                  {biz?.businessPhone && <p>{biz.businessPhone}</p>}
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-semibold" style={{ color: accent === "#00E5CC" ? "#0a9e90" : accent }}>Invoice</h1>
                {editing ? (
                  <input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                    placeholder="INV-001" className={inputCls + " text-right mt-1 w-32 ml-auto"} />
                ) : (
                  saved.invoiceNumber && <p className="text-sm font-medium text-gray-500 mt-1"># {saved.invoiceNumber}</p>
                )}
                <p className="text-xs text-gray-400 mt-4">Balance Due</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(saved.status === "paid" && !editing ? 0 : displayDueNow)}</p>
              </div>
            </div>

            {/* Bill To + dates */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-sm text-gray-500">Bill To</p>
                <p className="font-semibold text-gray-900">{client.company || client.name}</p>
                {project && <p className="text-sm text-gray-500 mt-1">{project.name}</p>}
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-end gap-6">
                  <span className="text-gray-500">Invoice Date:</span>
                  <span className="text-gray-800 w-28 text-right">{format(new Date(saved.createdAt), "yyyy/MM/dd")}</span>
                </div>
                <div className="flex justify-end gap-6 items-center">
                  <span className="text-gray-500">Due Date:</span>
                  {editing ? (
                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={inputCls + " w-28"} />
                  ) : (
                    <span className="text-gray-800 w-28 text-right">{saved.dueDate ? format(new Date(saved.dueDate), "yyyy/MM/dd") : "—"}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full mb-2">
              <thead>
                <tr style={{ backgroundColor: accent }}>
                  <th className="text-left py-2.5 px-3 text-xs uppercase tracking-wide font-semibold text-gray-900 w-10">#</th>
                  <th className="text-left py-2.5 px-3 text-xs uppercase tracking-wide font-semibold text-gray-900">Item & Description</th>
                  <th className="text-center py-2.5 px-2 text-xs uppercase tracking-wide font-semibold text-gray-900 w-16">Qty</th>
                  <th className="text-right py-2.5 px-3 text-xs uppercase tracking-wide font-semibold text-gray-900 w-28">Amount</th>
                  {editing && <th className="w-8" />}
                </tr>
              </thead>
              <tbody>
                {displayLineItems.map((li, i) => {
                  const qty = parseFloat(li.quantity || "1");
                  const price = parseFloat(li.unitPrice || "0");
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-gray-500">{i + 1}</td>
                      <td className="py-3 px-3 text-gray-800">
                        {editing ? (
                          <input value={li.description} onChange={e => {
                            const u = [...form.lineItems]; u[i] = { ...u[i], description: e.target.value };
                            setForm({ ...form, lineItems: u });
                          }} className={inputCls} />
                        ) : li.description}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-600">
                        {editing ? (
                          <input type="number" value={li.quantity} onChange={e => {
                            const u = [...form.lineItems]; u[i] = { ...u[i], quantity: e.target.value };
                            setForm({ ...form, lineItems: u });
                          }} className={inputCls + " text-center"} />
                        ) : qty.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-800">
                        {editing ? (
                          <input type="number" step="0.01" value={li.unitPrice ? String((parseFloat(li.unitPrice || "0") * qty).toFixed(2)) : ""} onChange={e => {
                            const amt = parseFloat(e.target.value || "0");
                            const u = [...form.lineItems]; u[i] = { ...u[i], unitPrice: String(amt / (qty || 1)) };
                            setForm({ ...form, lineItems: u });
                          }} className={inputCls + " text-right"} />
                        ) : (qty * price).toFixed(2)}
                      </td>
                      {editing && (
                        <td className="text-center">
                          <button type="button" onClick={() => setForm({ ...form, lineItems: form.lineItems.filter((_, j) => j !== i) })}
                            className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {editing && (
              <button type="button" onClick={() => setForm({ ...form, lineItems: [...form.lineItems, { description: "", quantity: "1", unitPrice: "" }] })}
                className="flex items-center gap-1 text-sm font-medium mb-6" style={{ color: "#0a9e90" }}>
                <Plus size={14} /> Add line item
              </button>
            )}

            {/* Summary */}
            <div className="flex justify-end mt-4">
              <div className="w-72 space-y-1.5">
                {project && (
                  <>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Total Project Price</span>
                      <span>{fmt(project.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Deposit</span>
                      <span>{fmt(project.depositAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center bg-gray-50 rounded px-3 py-2 mt-1 border-t border-gray-100 pt-2">
                  <span className="font-bold text-gray-900">Balance Due</span>
                  <span className="font-bold text-gray-900">{fmt(saved.status === "paid" && !editing ? 0 : displayDueNow)}</span>
                </div>
                {project && balanceDue !== null && balanceDue > 0.01 && (
                  <p className="text-xs text-gray-400 pt-1">
                    Remaining project balance due {balanceDueWhen}: {fmt(balanceDue)}
                  </p>
                )}
              </div>
            </div>

            {/* Paid stamp */}
            {!editing && saved.status === "paid" && (
              <div className="mt-6 flex justify-end">
                <span className="border-4 border-green-500 text-green-500 font-extrabold text-2xl px-6 py-2 rounded rotate-[-6deg] opacity-80 uppercase tracking-widest">
                  Paid
                </span>
              </div>
            )}

            {/* Notes + payment instructions */}
            <div className="mt-10 pt-6 border-t border-gray-200 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Notes</p>
                {editing ? (
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls + " mt-1"} />
                ) : (
                  saved.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{saved.notes}</p>
                )}
              </div>

              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Payment Method</label>
                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                      <option value="">— None —</option>
                      <option value="zelle">Zelle</option>
                      <option value="etransfer">e-Transfer</option>
                    </select>
                  </div>
                  {form.paymentMethod && (
                    <div>
                      <label className="text-xs text-gray-500">Send Payment To</label>
                      <input type="email" value={form.paymentEmail} onChange={e => setForm({ ...form, paymentEmail: e.target.value })} placeholder="payments@email.com" className={inputCls} />
                    </div>
                  )}
                </div>
              ) : (
                saved.paymentMethod && (
                  <p className="text-sm text-gray-600">
                    Please send payment via <span className="font-semibold">{saved.paymentMethod === "zelle" ? "Zelle" : saved.paymentMethod === "etransfer" ? "e-Transfer" : saved.paymentMethod}</span>
                    {saved.paymentEmail && <> to <span className="font-semibold" style={{ color: "#0a9e90" }}>{saved.paymentEmail}</span></>}.
                  </p>
                )
              )}
            </div>

            {/* Footer */}
            <div className="mt-14 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm font-medium text-gray-700">Thank you for your business!</p>
              {(biz?.businessEmail || biz?.businessPhone) && (
                <p className="text-xs text-gray-400 mt-1">
                  Questions? Contact us{biz?.businessEmail ? ` at ${biz.businessEmail}` : ""}{biz?.businessPhone ? ` · ${biz.businessPhone}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-sheet, .invoice-sheet * { visibility: visible !important; }
          .invoice-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
          }
          .invoice-page { background: white !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
          .no-print { display: none !important; }
          @page { size: letter; margin: 0.6in; }
        }
      `}</style>
    </>
  );
}
