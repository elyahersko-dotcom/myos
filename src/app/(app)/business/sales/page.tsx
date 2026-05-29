import { prisma } from "@/lib/prisma";
import LeadBoard from "./LeadBoard";

export default async function SalesPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Sales Pipeline</h1>
      <LeadBoard initialLeads={leads} />
    </div>
  );
}
