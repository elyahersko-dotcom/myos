"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

type Lead = {
  id: string; name: string; company: string | null; contact: string | null;
  notes: string | null; stage: string; nextFollowUp: Date | null;
};

const stages = [
  { key: "new", label: "New", color: "text-gray-400" },
  { key: "contacted", label: "Contacted", color: "text-blue-400" },
  { key: "qualified", label: "Qualified", color: "text-yellow-400" },
  { key: "proposal", label: "Proposal", color: "text-purple-400" },
  { key: "closed", label: "Closed", color: "text-green-400" },
];

const defaultForm = { name: "", company: "", contact: "", notes: "", stage: "new", nextFollowUp: "" };

export default function LeadBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [editLoading, setEditLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const lead = await res.json();
    setLeads([lead, ...leads]);
    setShowForm(false);
    setForm(defaultForm);
    setLoading(false);
  }

  async function moveLead(id: string, stage: string) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
    setLeads(leads.map((l) => (l.id === id ? { ...l, stage } : l)));
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setEditForm({
      name: lead.name,
      company: lead.company || "",
      contact: lead.contact || "",
      notes: lead.notes || "",
      stage: lead.stage,
      nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split("T")[0] : "",
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead) return;
    setEditLoading(true);
    const res = await fetch(`/api/leads/${editingLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setLeads(leads.map((l) => (l.id === editingLead.id ? { ...l, ...updated } : l)));
    setEditingLead(null);
    setEditLoading(false);
  }

  async function deleteLead(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads(leads.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={16} /> New Lead
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.key);
          return (
            <div key={stage.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 min-w-[200px]">
              <div className="flex items-center gap-2 mb-4">
                <h3 className={`font-semibold text-sm ${stage.color}`}>{stage.label}</h3>
                <span className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded-full">{stageLeads.length}</span>
              </div>
              <div className="space-y-3">
                {stageLeads.map((lead) => (
                  <div key={lead.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <p className="text-white text-sm font-medium flex-1 min-w-0">{lead.name}</p>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => openEdit(lead)} title="Edit"
                          className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeletingId(lead.id)} title="Delete"
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
                    {lead.nextFollowUp && (
                      <p className="text-xs text-yellow-500/80 mt-1">
                        Follow up: {format(new Date(lead.nextFollowUp), "MMM d")}
                      </p>
                    )}
                    {deletingId === lead.id && (
                      <div className="flex items-center gap-2 mt-2 bg-red-900/20 rounded-lg px-2 py-1.5">
                        <span className="text-xs text-red-400 flex-1">Delete?</span>
                        <button onClick={() => deleteLead(lead.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Confirm</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stages.filter((s) => s.key !== stage.key).map((s) => (
                        <button key={s.key} onClick={() => moveLead(lead.id, s.key)}
                          className="text-xs text-gray-500 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-1.5 py-0.5 transition-colors">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && <p className="text-gray-600 text-xs text-center py-2">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Lead</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={createLead} className="space-y-3">
              <LeadFormFields form={form} setForm={setForm} />
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
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Edit Lead</h2>
              <button onClick={() => setEditingLead(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <LeadFormFields form={editForm} setForm={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingLead(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
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

function LeadFormFields({ form, setForm }: {
  form: typeof defaultForm;
  setForm: (f: typeof defaultForm) => void;
}) {
  return (
    <>
      {[["name", "Name *"], ["company", "Company"], ["contact", "Contact (phone/email)"]].map(([k, label]) => (
        <div key={k}>
          <label className="block text-xs text-gray-400 mb-1">{label}</label>
          <input value={(form as Record<string, string>)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k === "name"}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      ))}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Stage</label>
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
          {[{ key: "new", label: "New" }, { key: "contacted", label: "Contacted" }, { key: "qualified", label: "Qualified" }, { key: "proposal", label: "Proposal" }, { key: "closed", label: "Closed" }].map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Next Follow-up</label>
        <input type="date" value={form.nextFollowUp} onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
    </>
  );
}
