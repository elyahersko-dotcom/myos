import { prisma } from "@/lib/prisma";
import ClientActions from "./ClientActions";
import ClientList from "./ClientList";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { tasks: true, invoices: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <ClientActions />
      </div>
      <ClientList initialClients={clients} />
    </div>
  );
}
