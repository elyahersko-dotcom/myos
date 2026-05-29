import { prisma } from "@/lib/prisma";
import CalendarView from "./CalendarView";

export default async function CalendarPage() {
  const events = await prisma.calendarEvent.findMany({ orderBy: { startTime: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Calendar</h1>
      <CalendarView initialEvents={events} />
    </div>
  );
}
