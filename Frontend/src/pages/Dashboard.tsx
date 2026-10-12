import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock, Headphones, Inbox, Mail, MailOpen, Reply, Users } from "lucide-react";
import { InfoCard, Avatar, Checkbox, MetricCard, PageHeader, PriorityBadge } from "../components/ui";
import { useStore } from "../store/useStore";
import { categoryCounts, dailyVolume, summaryStats } from "../lib/stats";
import { CATEGORY_CHART_COLORS, cn, listDate, timeAgo } from "../lib/utils";

export default function Dashboard() {
  const { emails, aiLogs, user, toggleAction } = useStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const stats = useMemo(() => summaryStats(emails), [emails]);
  const volume = useMemo(() => dailyVolume(emails, 7), [emails]);
  const cats = useMemo(() => categoryCounts(emails), [emails]);
  const total = cats.reduce((n, c) => n + c.value, 0);

  const recent = [...emails].filter((e) => !e.deleted && !e.archived).sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 7);

  const pending = emails
    .filter((e) => !e.deleted)
    .flatMap((e) => e.actions.map((a) => ({ e, a })))
    .filter(({ a }) => a.status === "Pending")
    .sort((x, y) => (x.a.deadline ?? "9").localeCompare(y.a.deadline ?? "9"))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="eyebrow">{today}</p>
        <h1 className="mt-1 text-3xl font-semibold text-gray-900 sm:text-4xl">{greeting}, {user?.name.split(" ")[0] ?? "there"}.</h1>
        <p className="mt-1.5 text-sm text-gray-600">{stats.replyRequired > 0 ? `${stats.replyRequired} ${stats.replyRequired === 1 ? "person is" : "people are"} waiting on a reply.` : "You're all caught up on replies."} Here's the rest of your day.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total emails" value={stats.total} icon={<Mail className="h-5 w-5" />} tone="blue" />
        <MetricCard label="Unread emails" value={stats.unread} icon={<MailOpen className="h-5 w-5" />} tone="violet" />
        <MetricCard label="Urgent emails" value={stats.urgent} icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
        <MetricCard label="Requiring reply" value={stats.replyRequired} icon={<Reply className="h-5 w-5" />} tone="amber" />
      </div>

      {/* Secondary metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Customer emails", value: stats.customer, icon: <Users className="h-4 w-4" />, style: "bg-blue-50 text-blue-700" },
          { label: "Sales emails", value: stats.sales, icon: <Inbox className="h-4 w-4" />, style: "bg-emerald-100 text-emerald-700" },
          { label: "Support emails", value: stats.support, icon: <Headphones className="h-4 w-4" />, style: "bg-violet-50 text-violet-700" },
          { label: "Pending actions", value: stats.pendingActions, icon: <Clock className="h-4 w-4" />, style: "bg-amber-100 text-amber-700" },
        ].map((m) => (
          <div key={m.label} className="card flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", m.style)}>{m.icon}</span>
              {m.label}
            </div>
            <span className="text-lg font-semibold">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h2 className="section-title">Email activity</h2>
          <p className="mb-4 text-xs text-gray-600">Incoming volume, last 7 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#4B5563" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#4B5563" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F3F4F6" }} contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                <Bar dataKey="count" name="Emails" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title">Category distribution</h2>
          <p className="mb-2 text-xs text-gray-600">Share of emails by category</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cats} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                    {cats.map((c) => <Cell key={c.name} fill={CATEGORY_CHART_COLORS[c.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-semibold">{total}</span>
                <span className="text-xs text-gray-600">emails</span>
              </div>
            </div>
            <ul className="w-full space-y-1.5 text-sm">
              {cats.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_CHART_COLORS[c.name] }} />
                    {c.name}
                  </span>
                  <span className="font-medium">{total ? Math.round((c.value / total) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Feeds */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="section-title">Recent emails</h2>
            <Link to="/inbox" className="text-xs font-medium text-blue-600 hover:underline">View inbox</Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {recent.map((e) => (
              <li key={e.id}>
                <Link to={`/inbox/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <Avatar name={e.sender} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", e.read ? "text-gray-700" : "font-semibold text-gray-900")}>{e.subject}</p>
                    <p className="truncate text-xs text-gray-600">{e.sender} · {e.summaryShort}</p>
                  </div>
                  <div className="hidden shrink-0 sm:block"><PriorityBadge value={e.priority} /></div>
                  <span className="shrink-0 text-xs text-gray-500">{listDate(e.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="section-title">Pending actions & deadlines</h2>
              <span className="chip bg-amber-100 text-amber-700">{stats.pendingActions}</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {pending.length === 0 && (
                <li className="flex items-center gap-2 px-5 py-6 text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> All caught up</li>
              )}
              {pending.map(({ e, a }) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5"><Checkbox checked={a.status === "Completed"} onChange={() => toggleAction(e.id, a.id)} /></div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">{a.text}</p>
                    <p className="text-xs text-gray-600">
                      {e.sender}
                      {a.deadlineLabel && (
                        <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">
                          Due {a.deadline ? new Date(a.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : a.deadlineLabel}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <InfoCard title="Recent activity">
            <ul className="space-y-2.5">
              {aiLogs.length === 0 && <li className="text-sm text-gray-600">Nothing yet — it will show up here as you work through your mail.</li>}
              {aiLogs.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span className="flex-1 text-gray-700">{l.text}</span>
                  <span className="shrink-0 text-xs text-gray-500">{timeAgo(l.date)}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
