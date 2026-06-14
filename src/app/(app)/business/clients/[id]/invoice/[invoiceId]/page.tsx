import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PrintButton from "./PrintButton";

export default async function InvoicePrintPage({
  params,
}: {
  params: { id: string; invoiceId: string };
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      client: true,
      project: true,
    },
  });

  if (!invoice || invoice.clientId !== params.id) notFound();

  const lineItems = Array.isArray(invoice.lineItems)
    ? (invoice.lineItems as { description: string; quantity: string; unitPrice: string }[])
    : [];

  const total = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0)
    : invoice.amount;

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        <a
          href={`/business/clients/${params.id}`}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
        >
          ← Back
        </a>
        <PrintButton />
      </div>

      {/* Invoice */}
      <div className="min-h-screen bg-white p-8 md:p-16 max-w-3xl mx-auto font-sans text-gray-900">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            {invoice.invoiceNumber && (
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{format(new Date(invoice.createdAt), "MMMM d, yyyy")}</p>
            {invoice.dueDate && (
              <>
                <p className="text-sm text-gray-500 mt-2">Due Date</p>
                <p className="font-medium">{format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
              </>
            )}
          </div>
        </div>

        {/* Client info */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Bill To</p>
          <p className="text-lg font-semibold text-gray-900">{invoice.client.name}</p>
          {invoice.client.company && <p className="text-gray-600">{invoice.client.company}</p>}
          {invoice.client.email && <p className="text-gray-600">{invoice.client.email}</p>}
          {invoice.client.phone && <p className="text-gray-600">{invoice.client.phone}</p>}
        </div>

        {/* Project */}
        {invoice.project && (
          <div className="mb-8 bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">Project</p>
            <p className="font-medium text-gray-800">{invoice.project.name}</p>
          </div>
        )}

        {/* Line items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 text-xs uppercase tracking-widest text-gray-400 font-medium">Description</th>
              <th className="text-center py-3 text-xs uppercase tracking-widest text-gray-400 font-medium w-20">Qty</th>
              <th className="text-right py-3 text-xs uppercase tracking-widest text-gray-400 font-medium w-28">Unit Price</th>
              <th className="text-right py-3 text-xs uppercase tracking-widest text-gray-400 font-medium w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length > 0 ? (
              lineItems.map((li, i) => {
                const qty = parseFloat(li.quantity || "1");
                const price = parseFloat(li.unitPrice || "0");
                return (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 text-gray-800">{li.description}</td>
                    <td className="py-3 text-center text-gray-600">{qty}</td>
                    <td className="py-3 text-right text-gray-600">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-medium">${(qty * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })
            ) : (
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-800">Services rendered</td>
                <td className="py-3 text-center text-gray-600">1</td>
                <td className="py-3 text-right text-gray-600">${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-3 text-right font-medium">${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-2">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-4 flex justify-end">
          {invoice.status === "paid" && (
            <span className="border-4 border-green-500 text-green-500 font-extrabold text-2xl px-6 py-2 rounded rotate-[-8deg] opacity-80 uppercase tracking-widest">
              Paid
            </span>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Notes</p>
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{invoice.notes}</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </>
  );
}
