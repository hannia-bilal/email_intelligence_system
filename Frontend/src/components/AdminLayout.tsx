import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, LogOut, Menu, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import { useStore } from "../store/useStore";
import { Avatar } from "./ui";
import { LogoMark } from "./Logo";
import { cn } from "../lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/admin/activity", label: "Activity", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function Side({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout, requests } = useStore();
  const nav = useNavigate();
  const open = requests.filter((r) => !r.done).length;
  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-gray-300">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark tone="light" className="h-9 w-9" />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-white">MailMind</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">Admin console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 pt-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-blue-600 text-white" : "hover:bg-white/10 hover:text-white")
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {to === "/admin/users" && open > 0 && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-gray-900">{open}</span>}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" onClick={() => { logout(); nav("/login"); }} aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}

export default function AdminLayout() {
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  useEffect(() => setDrawer(false), [loc.pathname]);
  return (
    <div className="flex h-full">
      <div className="hidden lg:block"><Side /></div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-64"><Side onNavigate={() => setDrawer(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-gray-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="ml-2 font-display font-semibold">Admin console</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
