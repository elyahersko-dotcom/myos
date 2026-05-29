"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  CreditCard,
  BarChart2,
  Calendar,
  ListTodo,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Business",
    icon: TrendingUp,
    children: [
      { href: "/business/clients", label: "Clients", icon: Users },
      { href: "/business/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/business/billing", label: "Billing", icon: FileText },
      { href: "/business/sales", label: "Sales", icon: TrendingUp },
    ],
  },
  {
    label: "Personal",
    icon: CreditCard,
    children: [
      { href: "/personal/payments", label: "Payments", icon: CreditCard },
      { href: "/personal/bank", label: "Bank", icon: BarChart2 },
      { href: "/personal/calendar", label: "Calendar", icon: Calendar },
      { href: "/personal/todos", label: "Todos", icon: ListTodo },
    ],
  },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
];

function NavItem({ item }: { item: (typeof nav)[0] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const Icon = item.icon;

  if ("children" in item && item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"
        >
          <Icon size={16} />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-0.5">
            {item.children.map((child) => (
              <NavItem key={child.href} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const active = pathname === item.href;
  return (
    <Link
      href={item.href!}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      <Icon size={16} />
      {item.label}
    </Link>
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item, i) => (
          <NavItem key={i} item={item} />
        ))}
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
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-700 text-white md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex-col h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-full z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
