import { prisma } from "@/lib/prisma";
import ChatInterface from "./ChatInterface";

export default async function AssistantPage() {
  const messages = await prisma.message.findMany({ orderBy: { createdAt: "asc" }, take: 100 });
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6 flex-shrink-0">AI Assistant</h1>
      <ChatInterface initialMessages={messages} />
    </div>
  );
}
