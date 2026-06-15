import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PrintButton from "./PrintButton";

const fmt = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2 });

export default async function InvoicePrintPage({
  params,
}: {
  params: { id: string; invoiceId: string };
}) {
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      include: { client: true, project: true },
    }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!invoice || invoice.clientId !== params.id) notFound();

  const lineItems = Array.isArray(invoice.lineItems)
    ? (invoice.lineItems as { description: string; quantity: string; unitPrice: string }[])
    : [];

  const dueNow = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0)
    : invoice.amount;

  const project = invoice.project as (typeof invoice.project & { totalCost: number; depositAmount: number; depositPaid: boolean }) | null;

  const projectTotal = project?.totalCost ?? null;
  const depositAmount = project?.depositAmount ?? 0;
  const depositPaid = project?.depositPaid ?? false;

  const isDepositInvoice = projectTotal !== null && Math.abs(dueNow - depositAmount) < 0.01;
  const isBalanceInvoice = projectTotal !== null && !isDepositInvoice;

  const biz = settings;
  const c = invoice.client;
  const accent = "#4f46e5"; // indigo-600

  return (
    <>
      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        <a href={`/business/clients/${params.id}`} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium">
          ← Back
        </a>
        <PrintButton />
      </div>

      <div className="invoice-page min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
        <div className="invoice-sheet mx-auto max-w-3xl bg-white shadow-xl print:shadow-none">

          {/* Top accent bar */}
          <div className="h-2 w-full" style={{ backgroundColor: accent }} />

          <div className="p-10 md:p-14">

            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                {biz?.businessName ? (
                  <>
                    <p className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{biz.businessName}</p>
                    {biz.businessTagline && <p className="text-gray-500 text-sm mt-1">{biz.businessTagline}</p>}
                    <div className="mt-3 text-sm text-gray-500 leading-relaxed">
                      {biz.businessAddress && <p className="whitespace-pre-line">{biz.businessAddress}</p>}
                      {biz.businessEmail && <p>{biz.businessEmail}</p>}
                      {biz.businessPhone && <p>{biz.businessPhone}</p>}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Add your business info in Settings</p>
                )}
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">INVOICE</h1>
                {invoice.invoiceNumber && (
                  <p className="text-sm font-medium text-gray-400 mt-1">{invoice.invoiceNumber}</p>
                )}
                <div className="mt-6 text-sm space-y-1">
                  <div className="flex justify-end gap-6">
                    <span className="text-gray-400">Issued</span>
                    <span className="font-medium text-gray-700 w-32 text-right">{format(new Date(invoice.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-end gap-6">
                      <span className="text-gray-400">Due</span>
                      <span className="font-medium text-gray-700 w-32 text-right">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-6 pt-1">
                    <span className="text-gray-400">Status</span>
                    <span className="w-32 text-right">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                        style={
                          invoice.status === "paid"
                            ? { backgroundColor: "#dcfce7", color: "#15803d" }
                            : invoice.status === "overdue"
                            ? { backgroundColor: "#fee2e2", color: "#b91c1c" }
                            : { backgroundColor: "#e0e7ff", color: accent }
                        }
                      >
                        {invoice.status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="flex justify-between gap-8 mb-10">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: accent }}>Bill To</p>
                <p className="text-lg font-bold text-gray-900">{c.company || c.name}</p>
                <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {c.address && <p className="whitespace-pre-line">{c.address}</p>}
                  {c.email && <p>{c.email}</p>}
                  {c.phone && <p>{c.phone}</p>}
                </div>
              </div>
              {project && (
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: accent }}>Project</p>
                  <p className="text-base font-semibold text-gray-800">{project.name}</p>
                </div>
              )}
            </div>

            {/* Line items */}
            <table className="w-full mb-2">
              <thead>
                <tr style={{ backgroundColor: accent }} className="text-white">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-semibold rounded-l-lg">Description</th>
                  <th className="text-center py-3 px-2 text-xs uppercase tracking-wider font-semibold w-16">Qty</th>
                  <th className="text-right py-3 px-2 text-xs uppercase tracking-wider font-semibold w-32">Unit Price</th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-semibold w-32 rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(lineItems.length > 0 ? lineItems : [{ description: "Services rendered", quantity: "1", unitPrice: String(invoice.amount) }]).map((li, i) => {
                  const qty = parseFloat(li.quantity || "1");
                  const price = parseFloat(li.unitPrice || "0");
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-4 px-4 text-gray-800 font-medium">{li.description}</td>
                      <td className="py-4 px-2 text-center text-gray-600">{qty}</td>
                      <td className="py-4 px-2 text-right text-gray-600">{fmt(price)}</td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">{fmt(qty * price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Payment summary */}
            <div className="flex justify-end mt-6">
              <div className="w-80 space-y-1.5">
                {projectTotal !== null && (
                  <div className="flex justify-between text-sm text-gray-500 py-1">
                    <span>Total Project Price</span>
                    <span className="font-medium text-gray-700">{fmt(projectTotal)}</span>
                  </div>
                )}
                {isDepositInvoice && (
                  <div className="flex justify-between text-sm text-gray-500 py-1">
                    <span>Remaining Balance (due later)</span>
                    <span>{fmt(projectTotal! - dueNow)}</span>
                  </div>
                )}
                {isBalanceInvoice && depositAmount > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 py-1">
                    <span>{depositPaid ? "Deposit Paid" : "Deposit"}</span>
                    <span className={depositPaid ? "text-green-600" : ""}>{depositPaid ? "− " : ""}{fmt(depositAmount)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between items-center mt-3 px-4 py-3 rounded-lg text-white"
                  style={{ backgroundColor: accent }}
                >
                  <span className="font-semibold">Amount Due</span>
                  <span className="font-extrabold text-xl">{fmt(dueNow)}</span>
                </div>
              </div>
            </div>

            {/* Paid stamp */}
            {invoice.status === "paid" && (
              <div className="mt-6 flex">
                <span className="border-4 border-green-500 text-green-500 font-extrabold text-2xl px-6 py-2 rounded rotate-[-6deg] opacity-80 uppercase tracking-widest">
                  Paid
                </span>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: accent }}>Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{invoice.notes}</p>
              </div>
            )}

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
          /* Hide everything (sidebar, nav, buttons)… */
          body * { visibility: hidden !important; }
          /* …then show only the invoice sheet */
          .invoice-sheet, .invoice-sheet * { visibility: visible !important; }
          .invoice-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .invoice-page { background: white !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </>
  );
}
