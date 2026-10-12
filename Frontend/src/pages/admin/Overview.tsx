import { Link } from "react-router-dom";
import { KeyRound, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Avatar, MetricCard, PageHeader } from "../../components/ui";
import { useStore } from "../../store/useStore";
import { timeAgo } from "../../lib/utils";

export default function Overview() {
  const { accounts, requests, audit, user } = useStore();
  const members = accounts.filter((a) => a.role === "user");
  const admins = accounts.filter((a) => a.role === "admin");
  const open = requests.filter((r) => !r.done);
  const newest = [...members].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader title={`Hello, ${user?.name.split(" ")[0] ?? "admin"}`} subtitle="A quick look at who is using MailMind." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Members" value={members.length} icon={<Users className="h-5 w-5" />} tone="blue" />
        <MetricCard label="Active members" value={members.filter((m) => m.active).length} icon={<UserCheck className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Admins" value={admins.length} icon={<ShieldCheck className="h-5 w-5" />} tone="violet" />
        <MetricCard label="Password requests" value={open.length} icon={<KeyRound className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="section-title">Newest members</h2>
            <Link to="/admin/users" className="text-xs font-medium text-blue-600 hover:underline">Manage users</Link>
          </div>
          {newest.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-600">Nobody has registered yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {newest.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="truncate text-xs text-gray-600">{m.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">{timeAgo(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="section-title">Recent admin activity</h2>
            <Link to="/admin/activity" className="text-xs font-medium text-blue-600 hover:underline">See all</Link>
          </div>
          {audit.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-600">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {audit.slice(0, 6).map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="text-sm text-gray-900">{a.text}</p>
                  <p className="text-xs text-gray-500">{a.who} · {timeAgo(a.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
