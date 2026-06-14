"use client";
import { useState } from "react";
import { User, Briefcase, Check } from "lucide-react";

type Settings = {
  personalName?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  personalAddress?: string | null;
  businessName?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  businessTagline?: string | null;
};

const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState({
    personalName: initial.personalName || "",
    personalEmail: initial.personalEmail || "",
    personalPhone: initial.personalPhone || "",
    personalAddress: initial.personalAddress || "",
    businessName: initial.businessName || "",
    businessEmail: initial.businessEmail || "",
    businessPhone: initial.businessPhone || "",
    businessAddress: initial.businessAddress || "",
    businessTagline: initial.businessTagline || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [k]: e.target.value });
      setSaved(false);
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Personal Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <User size={16} className="text-emerald-400" /> Personal Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input value={form.personalName} onChange={set("personalName")} placeholder="John Smith" className={inp} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.personalEmail} onChange={set("personalEmail")} placeholder="you@email.com" className={inp} />
          </Field>
          <Field label="Phone">
            <input value={form.personalPhone} onChange={set("personalPhone")} placeholder="+1 555 000 0000" className={inp} />
          </Field>
        </div>
        <Field label="Address">
          <textarea value={form.personalAddress} onChange={set("personalAddress")} rows={2} placeholder="123 Main St, City, State, ZIP" className={inp} />
        </Field>
      </div>

      {/* Business Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Briefcase size={16} className="text-indigo-400" /> Business Info
          <span className="text-xs text-gray-500 font-normal ml-1">— appears on invoices</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business Name">
            <input value={form.businessName} onChange={set("businessName")} placeholder="My Company LLC" className={inp} />
          </Field>
          <Field label="Business Email">
            <input type="email" value={form.businessEmail} onChange={set("businessEmail")} placeholder="hello@mybusiness.com" className={inp} />
          </Field>
          <Field label="Business Phone">
            <input value={form.businessPhone} onChange={set("businessPhone")} placeholder="+1 555 000 0000" className={inp} />
          </Field>
          <Field label="Tagline / Description">
            <input value={form.businessTagline} onChange={set("businessTagline")} placeholder="Professional services" className={inp} />
          </Field>
        </div>
        <Field label="Business Address">
          <textarea value={form.businessAddress} onChange={set("businessAddress")} rows={2} placeholder="123 Business Ave, City, State, ZIP" className={inp} />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-400">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
