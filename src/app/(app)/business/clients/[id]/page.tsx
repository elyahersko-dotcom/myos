import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientHub from "./ClientHub";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      tasks: { orderBy: { createdAt: "desc" } },
      invoices: { include: { project: true }, orderBy: { createdAt: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) notFound();
  return <ClientHub client={client} />;
}
