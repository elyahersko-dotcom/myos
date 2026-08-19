import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InvoiceView from "./InvoiceView";

// Sets the page title → becomes the default filename when saving as PDF
export async function generateMetadata({ params }: { params: { invoiceId: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: { invoiceNumber: true },
  });
  return { title: { absolute: invoice?.invoiceNumber || "Invoice" } };
}

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

  let previouslyInvoiced = 0;
  if (invoice.projectId) {
    const otherInvoices = await prisma.invoice.findMany({
      where: { projectId: invoice.projectId, id: { not: invoice.id } },
      select: { amount: true },
    });
    previouslyInvoiced = otherInvoices.reduce((s, i) => s + i.amount, 0);
  }

  return (
    <InvoiceView
      clientId={params.id}
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
        createdAt: invoice.createdAt.toISOString(),
        lineItems: Array.isArray(invoice.lineItems)
          ? (invoice.lineItems as { description: string; quantity: string; unitPrice: string }[])
          : [],
        notes: invoice.notes,
        paymentMethod: invoice.paymentMethod,
        paymentEmail: invoice.paymentEmail,
      }}
      client={{
        name: invoice.client.name,
        company: invoice.client.company,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
      }}
      project={invoice.project ? {
        name: invoice.project.name,
        totalCost: invoice.project.totalCost,
        depositAmount: invoice.project.depositAmount,
        endDate: invoice.project.endDate ? invoice.project.endDate.toISOString() : null,
      } : null}
      biz={settings ? {
        businessName: settings.businessName,
        businessTagline: settings.businessTagline,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone,
        businessAddress: settings.businessAddress,
      } : null}
      previouslyInvoiced={previouslyInvoiced}
    />
  );
}
