"use client";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, X, Check } from "lucide-react";

type Project = {
  id: string; name: string; description: string | null; totalCost: number;
  depositAmount: number; depositPaid: boolean; status: string;
  startDate: Date | null; endDate: Date | null;
};
type Task = {
  id: string; title: string; description: string | null; dueDate: Date | null;
  priority: string; status: string;
};
type Invoice = {
  id: string; amount: number; status: string; dueDate: Date | null;
  invoiceNumber: string | null; notes: string | null; projectId: string | null;
  project: { name: string } | null; lineItems: unknown;
};
type Client = {
  id: string; name: string; company: string | null; email: string | null;
  phone: string | null; notes: string | null; status: string;
  tasks: Task[]; invoices: Invoice[]; projects: Project[];
};

const priorityColor: Record<string, string> = {
  low: "text-gray-400", medium: "text-blue-400", high: "text-orange-400", urgent: "text-red-400",
};
const statusBadge: Record<string, string> = {
  todo: "bg-gray-500/20 text-gray-400",
  "in-progress": "bg-blue-500/20 text-blue-400",
  done: "bg-green-500/20 text-green-400",
  draft: "bg-gray-500/20 text-gray-400",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
  active: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  "on-hold": "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function ClientHub({ client }: { client: Client }) {
  const [tasks, setTasks] = useState(client.tasks);
  const [invoices, setInvoices] = useState(client.invoices);
  const [projects, setProjects] = useState(client.projects);
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks" | "invoices">("overview");

  // Modal states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", priority: "medium", status: "todo" });

  // Project form
  const [projectForm, setProjectForm] = useState({
    name: "", description: "", totalCost: "", depositAmount: "", depositPaid: false,
    status: "active", startDate: "", endDate: "",
  });

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    projectId: "", invoiceNumber: "", amount: "", status: "draft", dueDate: "", notes: "",
    lineItems: [{ description: "", quantity: "1", unitPrice: "" }],
  });

  const [loading, setLoading] = useState(false);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, clientId: client.id }),
    });
    const task = await res.json();
    setTasks([task, ...tasks]);
    setShowTaskForm(false);
    setTaskForm({ title: "", description: "", dueDate: "", priority: "medium", status: "todo" });
    setLoading(false);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...projectForm,
        clientId: client.id,
        totalCost: parseFloat(projectForm.totalCost),
        depositAmount: parseFloat(projectForm.depositAmount || "0"),
      }),
    });
    const project = await res.json();
    setProjects([project, ...projects]);
    setShowProjectForm(false);
    setProjectForm({ name: "", description: "", totalCost: "", depositAmount: "", depositPaid: false, status: "active", startDate: "", endDate: "" });
    setLoading(false);
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const lineItems = invoiceForm.lineItems.filter(li => li.description);
    const amount = lineItems.reduce((s, li) => s + (parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1")), 0) || parseFloat(invoiceForm.amount || "0");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: client.id,
        projectId: invoiceForm.projectId || null,
        invoiceNumber: invoiceForm.invoiceNumber || null,
        amount,
        status: invoiceForm.status,
        dueDate: invoiceForm.dueDate || null,
        notes: invoiceForm.notes || null,
        lineItems,
      }),
    });
    const invoice = await res.json();
    setInvoices([{ ...invoice, project: projects.find(p => p.id === invoiceForm.projectId) || null }, ...invoices]);
    setShowInvoiceForm(false);
    setInvoiceForm({ projectId: "", invoiceNumber: "", amount: "", status: "draft", dueDate: "", notes: "", lineItems: [{ description: "", quantity: "1", unitPrice: "" }] });
    setLoading(false);
  }

  async function toggleTaskStatus(id: string, current: string) {
    const status = current === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  }

  async function markInvoicePaid(id: string) {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    setInvoices(invoices.map(i => i.id === id ? { ...i, status: "paid" } : i));
  }

  async function toggleDepositPaid(projectId: string, current: boolean) {
    await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ depositPaid: !current }) });
    setProjects(projects.map(p => p.id === projectId ? { ...p, depositPaid: !current } : p));
  }

  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOwed = totalInvoiced - totalPaid;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "projects", label: `Projects (${projects.length})` },
    { key: "tasks", label: `Tasks (${tasks.length})` },
    { key: "invoices", label: `Invoices (${invoices.length})` },
  ] as const;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/business/clients" className="text-sm text-gray-500 hover:text-white">← Clients</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{client.name}</h1>
          {client.company && <p className="text-gray-400">{client.company}</p>}
          <div className="flex gap-3 mt-2 text-sm text-gray-500">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[client.status] || statusBadge.active}`}>{client.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowProjectForm(true); setActiveTab("projects"); }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
            <Plus size={15} /> Project
          </button>
          <button onClick={() => { setShowTaskForm(true); setActiveTab("tasks"); }}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-3 py-2 text-sm transition-colors">
            <Plus size={15} /> Task
          </button>
          <button onClick={() => { setShowInvoiceForm(true); setActiveTab("invoices"); }}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-3 py-2 text-sm transition-colors">
            <Plus size={15} /> Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
          <p className="text-xl font-bold text-white">${totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className="text-xl font-bold text-orange-400">${totalOwed.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-white"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {client.notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Notes</p>
              <p className="text-white whitespace-pre-wrap text-sm">{client.notes}</p>
            </div>
          )}

          {/* Recent Projects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Projects</h3>
              <button onClick={() => setActiveTab("projects")} className="text-xs text-gray-500 hover:text-white">View all</button>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 3).map(p => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[p.status]}`}>{p.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-xs text-gray-500">Total Cost</p><p className="text-white font-medium">${p.totalCost.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">Deposit</p><p className="text-white font-medium">${p.depositAmount.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">Deposit Paid</p>
                      <button onClick={() => toggleDepositPaid(p.id, p.depositPaid)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${p.depositPaid ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                        {p.depositPaid ? "✓ Paid" : "Unpaid"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-gray-600 text-sm">No projects yet. <button onClick={() => setShowProjectForm(true)} className="text-indigo-400 hover:text-indigo-300">Create one</button></p>}
            </div>
          </div>

          {/* Recent Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Recent Tasks</h3>
              <button onClick={() => setActiveTab("tasks")} className="text-xs text-gray-500 hover:text-white">View all</button>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                  <button onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.status === "done" ? "bg-indigo-600 border-indigo-600" : "border-gray-600 hover:border-indigo-500"}`}>
                    {task.status === "done" && <Check size={12} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-gray-500" : "text-white"}`}>{task.title}</span>
                  <span className={`text-xs capitalize ${priorityColor[task.priority]}`}>{task.priority}</span>
                  {task.dueDate && <span className="text-xs text-gray-500">{format(new Date(task.dueDate), "MMM d")}</span>}
                </div>
              ))}
              {tasks.length === 0 && <p className="text-gray-600 text-sm">No tasks yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowProjectForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <Plus size={15} /> New Project
            </button>
          </div>
          {projects.map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-lg">{p.name}</h3>
                  {p.description && <p className="text-gray-400 text-sm mt-1">{p.description}</p>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[p.status]}`}>{p.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Project Cost</p>
                  <p className="text-white font-bold text-lg">${p.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Deposit Required</p>
                  <p className="text-white font-bold text-lg">${p.depositAmount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Balance Due</p>
                  <p className="text-orange-400 font-bold text-lg">${(p.totalCost - p.depositAmount).toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Deposit Status</p>
                  <button onClick={() => toggleDepositPaid(p.id, p.depositPaid)}
                    className={`mt-1 text-xs font-medium px-3 py-1 rounded-full transition-colors ${p.depositPaid ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                    {p.depositPaid ? "✓ Deposit Paid" : "Mark Deposit Paid"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                {p.startDate && <span>Start: {format(new Date(p.startDate), "MMM d, yyyy")}</span>}
                {p.endDate && <span>End: {format(new Date(p.endDate), "MMM d, yyyy")}</span>}
              </div>
              {/* Linked invoices */}
              {invoices.filter(i => i.projectId === p.id).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Invoices</p>
                  <div className="space-y-1">
                    {invoices.filter(i => i.projectId === p.id).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{inv.invoiceNumber || `Invoice`}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">${inv.amount.toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[inv.status]}`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {projects.length === 0 && <p className="text-center text-gray-500 py-8">No projects yet.</p>}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <Plus size={15} /> New Task
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <button onClick={() => toggleTaskStatus(task.id, task.status)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.status === "done" ? "bg-indigo-600 border-indigo-600" : "border-gray-600 hover:border-indigo-500"}`}>
                  {task.status === "done" && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-white"}`}>{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                </div>
                <span className={`text-xs capitalize flex-shrink-0 ${priorityColor[task.priority]}`}>{task.priority}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${statusBadge[task.status]}`}>{task.status}</span>
                {task.dueDate && <span className="text-xs text-gray-500 flex-shrink-0">{format(new Date(task.dueDate), "MMM d")}</span>}
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-gray-500 py-8">No tasks for this client.</p>}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowInvoiceForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <Plus size={15} /> New Invoice
            </button>
          </div>
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{inv.invoiceNumber || "Invoice"}</p>
                    {inv.project && <p className="text-xs text-gray-500 mt-0.5">Project: {inv.project.name}</p>}
                    {inv.notes && <p className="text-xs text-gray-500 mt-0.5">{inv.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">${inv.amount.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[inv.status]}`}>{inv.status}</span>
                    {inv.status !== "paid" && (
                      <button onClick={() => markInvoicePaid(inv.id)}
                        className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg px-3 py-1 transition-colors">
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
                {inv.dueDate && (
                  <p className="text-xs text-gray-500 mt-2">Due: {format(new Date(inv.dueDate), "MMM d, yyyy")}</p>
                )}
                {Array.isArray(inv.lineItems) && (inv.lineItems as {description:string;quantity:string;unitPrice:string}[]).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
                    {(inv.lineItems as {description:string;quantity:string;unitPrice:string}[]).map((li, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-400">
                        <span>{li.description} {li.quantity && li.quantity !== "1" ? `× ${li.quantity}` : ""}</span>
                        <span>${(parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1")).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {invoices.length === 0 && <p className="text-center text-gray-500 py-8">No invoices yet.</p>}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskForm && (
        <Modal title="New Task" onClose={() => setShowTaskForm(false)}>
          <form onSubmit={createTask} className="space-y-3">
            <Field label="Title *"><input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required className={input} /></Field>
            <Field label="Description"><textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} className={input} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className={input}>
                  {["low", "medium", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} className={input}>
                  {["todo", "in-progress", "done"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Due Date"><input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className={input} /></Field>
            <ModalButtons loading={loading} onClose={() => setShowTaskForm(false)} />
          </form>
        </Modal>
      )}

      {/* Project Modal */}
      {showProjectForm && (
        <Modal title="New Project" onClose={() => setShowProjectForm(false)}>
          <form onSubmit={createProject} className="space-y-3">
            <Field label="Project Name *"><input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} required className={input} /></Field>
            <Field label="Description"><textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} rows={2} className={input} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Project Cost *">
                <div className="relative"><span className="absolute left-3 top-2 text-gray-400">$</span>
                  <input type="number" step="0.01" value={projectForm.totalCost} onChange={e => setProjectForm({ ...projectForm, totalCost: e.target.value })} required className={input + " pl-7"} /></div>
              </Field>
              <Field label="Deposit Amount">
                <div className="relative"><span className="absolute left-3 top-2 text-gray-400">$</span>
                  <input type="number" step="0.01" value={projectForm.depositAmount} onChange={e => setProjectForm({ ...projectForm, depositAmount: e.target.value })} className={input + " pl-7"} /></div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date"><input type="date" value={projectForm.startDate} onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })} className={input} /></Field>
              <Field label="End Date"><input type="date" value={projectForm.endDate} onChange={e => setProjectForm({ ...projectForm, endDate: e.target.value })} className={input} /></Field>
            </div>
            <Field label="Status">
              <select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })} className={input}>
                {["active", "on-hold", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="depositPaid" checked={projectForm.depositPaid} onChange={e => setProjectForm({ ...projectForm, depositPaid: e.target.checked })} className="rounded" />
              <label htmlFor="depositPaid" className="text-sm text-gray-400">Deposit already paid</label>
            </div>
            <ModalButtons loading={loading} onClose={() => setShowProjectForm(false)} />
          </form>
        </Modal>
      )}

      {/* Invoice Modal */}
      {showInvoiceForm && (
        <Modal title="New Invoice" onClose={() => setShowInvoiceForm(false)}>
          <form onSubmit={createInvoice} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice #"><input value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} placeholder="INV-001" className={input} /></Field>
              <Field label="Status">
                <select value={invoiceForm.status} onChange={e => setInvoiceForm({ ...invoiceForm, status: e.target.value })} className={input}>
                  {["draft", "sent", "paid", "overdue"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            {projects.length > 0 && (
              <Field label="Link to Project">
                <select value={invoiceForm.projectId} onChange={e => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })} className={input}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            )}
            {/* Line Items */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Line Items</label>
              <div className="space-y-2">
                {invoiceForm.lineItems.map((li, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input placeholder="Description" value={li.description} onChange={e => {
                      const updated = [...invoiceForm.lineItems];
                      updated[i] = { ...updated[i], description: e.target.value };
                      setInvoiceForm({ ...invoiceForm, lineItems: updated });
                    }} className={input + " col-span-6"} />
                    <input placeholder="Qty" type="number" value={li.quantity} onChange={e => {
                      const updated = [...invoiceForm.lineItems];
                      updated[i] = { ...updated[i], quantity: e.target.value };
                      setInvoiceForm({ ...invoiceForm, lineItems: updated });
                    }} className={input + " col-span-2"} />
                    <input placeholder="Price" type="number" step="0.01" value={li.unitPrice} onChange={e => {
                      const updated = [...invoiceForm.lineItems];
                      updated[i] = { ...updated[i], unitPrice: e.target.value };
                      setInvoiceForm({ ...invoiceForm, lineItems: updated });
                    }} className={input + " col-span-3"} />
                    <button type="button" onClick={() => setInvoiceForm({ ...invoiceForm, lineItems: invoiceForm.lineItems.filter((_, j) => j !== i) })}
                      className="col-span-1 text-gray-500 hover:text-red-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setInvoiceForm({ ...invoiceForm, lineItems: [...invoiceForm.lineItems, { description: "", quantity: "1", unitPrice: "" }] })}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">+ Add line item</button>
              <div className="mt-2 text-right text-sm text-white font-medium">
                Total: ${invoiceForm.lineItems.reduce((s, li) => s + (parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1")), 0).toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due Date"><input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className={input} /></Field>
            </div>
            <Field label="Notes"><textarea value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} rows={2} className={input} /></Field>
            <ModalButtons loading={loading} onClose={() => setShowInvoiceForm(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

const input = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalButtons({ loading, onClose }: { loading: boolean; onClose: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
      <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
        {loading ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
