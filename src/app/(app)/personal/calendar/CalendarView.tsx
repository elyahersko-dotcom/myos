"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from "lucide-react";

type CalEvent = { id: string; title: string; description: string | null; startTime: Date; endTime: Date; allDay: boolean };

const defaultForm = { title: "", description: "", startTime: "", endTime: "", allDay: false };

export default function CalendarView({ initialEvents }: { initialEvents: CalEvent[] }) {
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [editLoading, setEditLoading] = useState(false);

  // Selected event detail popup
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const firstDayOfWeek = startOfMonth(current).getDay();

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...form,
      startTime: form.allDay ? `${form.startTime}T00:00:00` : form.startTime,
      endTime: form.allDay ? `${form.endTime || form.startTime}T23:59:59` : (form.endTime || form.startTime),
    };
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const ev = await res.json();
    setEvents([...events, ev]);
    setShowForm(false);
    setForm(defaultForm);
    setLoading(false);
  }

  function openEdit(ev: CalEvent) {
    setSelectedEvent(null);
    setEditingEvent(ev);
    const startStr = new Date(ev.startTime).toISOString();
    const endStr = new Date(ev.endTime).toISOString();
    setEditForm({
      title: ev.title,
      description: ev.description || "",
      allDay: ev.allDay,
      startTime: ev.allDay ? startStr.split("T")[0] : startStr.slice(0, 16),
      endTime: ev.allDay ? endStr.split("T")[0] : endStr.slice(0, 16),
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    setEditLoading(true);
    const body = {
      ...editForm,
      startTime: editForm.allDay ? `${editForm.startTime}T00:00:00` : editForm.startTime,
      endTime: editForm.allDay ? `${editForm.endTime || editForm.startTime}T23:59:59` : (editForm.endTime || editForm.startTime),
    };
    const res = await fetch(`/api/events/${editingEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setEvents(events.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...updated } : ev)));
    setEditingEvent(null);
    setEditLoading(false);
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents(events.filter((ev) => ev.id !== id));
    setSelectedEvent(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><ChevronLeft size={18} /></button>
          <h2 className="text-lg font-semibold text-white w-40 text-center">{format(current, "MMMM yyyy")}</h2>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><ChevronRight size={18} /></button>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={16} /> Event
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-3 text-center text-xs text-gray-500 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-800/50 min-h-[80px]" />
          ))}
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="border-b border-r border-gray-800/50 min-h-[80px] p-1.5">
                <p className={`text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-indigo-600 text-white font-bold" : "text-gray-400"}`}>
                  {format(day, "d")}
                </p>
                {dayEvents.map((ev) => (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                    className="bg-indigo-600/30 border border-indigo-600/50 rounded px-1 py-0.5 mb-1 cursor-pointer hover:bg-indigo-600/50 transition-colors">
                    <p className="text-xs text-indigo-300 truncate">{ev.title}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event detail popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">{selectedEvent.title}</h2>
              <button onClick={() => setSelectedEvent(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              {format(new Date(selectedEvent.startTime), selectedEvent.allDay ? "MMM d, yyyy" : "MMM d, yyyy h:mm a")}
            </p>
            {selectedEvent.description && <p className="text-sm text-gray-300 mt-2">{selectedEvent.description}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => openEdit(selectedEvent)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => deleteEvent(selectedEvent.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Event</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={createEvent} className="space-y-3">
              <EventFormFields form={form} setForm={setForm} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <EventFormFields form={editForm} setForm={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={editLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {editLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EventFormFields({ form, setForm }: {
  form: typeof defaultForm;
  setForm: (f: typeof defaultForm) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Title *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="allDay" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} className="rounded" />
        <label htmlFor="allDay" className="text-sm text-gray-400">All Day</label>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Start {form.allDay ? "Date" : "Time"} *</label>
        <input type={form.allDay ? "date" : "datetime-local"} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      {!form.allDay && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">End Time</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
    </>
  );
}
