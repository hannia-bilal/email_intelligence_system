import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { Avatar } from "./ui";
import { LogoMark, Wordmark } from "./Logo";
import { cn, timeAgo } from "../lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Mail },
  { to: "/assistant", label: "Ask your inbox", icon: MessageCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/import", label: "Import mail", icon: Upload },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const emails = useStore((s) => s.emails);
  const { user, logout } = useStore();
  const nav = useNavigate();
  const unread = emails.filter((e) => !e.read && !e.deleted && !e.archived).length;
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="h-9 w-9" />
        <Wordmark />
      </div>
      <nav className="flex-1 space-y-1 px-3 pt-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 before:absolute before:-left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-1 before:rounded-r-full before:bg-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {to === "/inbox" && unread > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="m-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <Avatar name={user.name} size="sm" />
          <button className="min-w-0 flex-1 text-left" onClick={() => { onNavigate?.(); nav("/profile"); }}>
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">View profile</p>
          </button>
          <button className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-red-500" onClick={() => { logout(); nav("/login"); }} aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const { notifications, prefs, markNotificationRead, markAllNotificationsRead } = useStore();
  const visible = notifications.filter((n) => {
    const map = { urgent: prefs.urgent, complaint: prefs.complaint, reply: prefs.reply, deadline: prefs.deadline, action: prefs.action, ai: prefs.ai } as const;
    return map[n.type];
  });
  const unread = visible.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button className="text-xs font-medium text-blue-600 hover:underline" onClick={markAllNotificationsRead}>Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 && <p className="p-4 text-sm text-gray-600">You're all caught up.</p>}
            {visible.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  setOpen(false);
                  if (n.emailId) nav(`/inbox/${n.emailId}`);
                }}
                className={cn("flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50", !n.read && "bg-blue-50/40")}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-gray-300" : "bg-blue-600")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                  <span className="block truncate text-xs text-gray-600">{n.body}</span>
                  <span className="text-xs text-gray-400">{timeAgo(n.date)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const { user, logout } = useStore();
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100">
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-sm font-medium sm:block">{user.name}</span>
        <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-pop">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-gray-600">{user.email}</p>
          </div>
          <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); nav("/profile"); }}>
            <UserIcon className="h-4 w-4" /> Profile & settings
          </button>
          <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50" onClick={() => { logout(); nav("/login"); }}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const nav = useNavigate();
  const loc = useLocation();
  const { globalQuery, setGlobalQuery } = useStore();
  return (
    <form
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (!loc.pathname.startsWith("/inbox")) nav("/inbox");
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={globalQuery}
        onChange={(e) => {
          setGlobalQuery(e.target.value);
          if (!loc.pathname.startsWith("/inbox") && e.target.value) nav("/inbox");
        }}
        placeholder='Search your mail — try "angry customers" or "invoices"'
        className="input pl-9 pr-9"
        aria-label="Global search"
      />
      {globalQuery && (
        <button type="button" onClick={() => setGlobalQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

export default function Layout() {
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  useEffect(() => setDrawer(false), [loc.pathname]);

  return (
    <div className="flex h-full bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-64">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <NavLink to="/profile" className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 sm:block" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </NavLink>
            <NotificationsMenu />
            <UserMenu />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
