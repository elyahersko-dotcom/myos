"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Briefcase, Users, CheckSquare, FileText, TrendingUp,
  User, CreditCard, BarChart2, Calendar, ListTodo,
  MessageSquare, Menu, X, LogOut, LayoutDashboard, Settings,
} from "lucide-react";

const businessLinks = [
  { href: "/business", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/business/clients", label: "Clients", icon: Users },
  { href: "/business/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/business/billing", label: "Billing", icon: FileText },
  { href: "/business/sales", label: "Sales", icon: TrendingUp },
];

const personalLinks = [
  { href: "/personal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/personal/payments", label: "Payments", icon: CreditCard },
  { href: "/personal/bank", label: "Bank", icon: BarChart2 },
  { href: "/personal/calendar", label: "Calendar", icon: Calendar },
  { href: "/personal/todos", label: "Todos", icon: ListTodo },
];

function NavLink({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ElementType; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href) && (href !== "/business" && href !== "/personal" ? true : pathname === href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  );
}

function Section({ label, icon: Icon, links, color }: { label: string; icon: React.ElementType; links: typeof businessLinks; color: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${color} hover:bg-gray-800/50`}
      >
        <Icon size={13} />
        <span className="flex-1 text-left">{label}</span>
        <span className="text-gray-600">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {links.map(l => <NavLink key={l.href} {...l} />)}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">MyOS</h1>
        <p className="text-xs text-gray-500">Personal Operating System</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <Section label="Business" icon={Briefcase} links={businessLinks} color="text-indigo-400" />
        <div className="border-t border-gray-800" />
        <Section label="Personal" icon={User} links={personalLinks} color="text-emerald-400" />
        <div className="border-t border-gray-800" />
        <NavLink href="/assistant" label="AI Assistant" icon={MessageSquare} />
        <NavLink href="/settings" label="Settings" icon={Settings} />
      </nav>
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-700 text-white md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex-col h-screen sticky top-0">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-full z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
