import { useMemo, useState } from "react";
import { Copy, KeyRound, Search, ShieldPlus, Trash2, X } from "lucide-react";
import { Avatar, EmptyState, Modal, PageHeader, Toggle } from "../../components/ui";
import { useStore } from "../../store/useStore";
import { sameEmail } from "../../lib/accounts";
import { formatDate, timeAgo } from "../../lib/utils";

export default function Users() {
  const { accounts, requests, setActive, setRole, deleteAccount, resetPasswordFor, dismissRequest, toast } = useStore();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [temp, setTemp] = useState<{ name: string; pw: string } | null>(null);

  const members = useMemo(
    () =>
      accounts
        .filter((a) => a.role === "user")
        .filter((a) => `${a.name} ${a.email} ${a.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [accounts, q],
  );
  const open = requests.filter((r) => !r.done);
  const target = accounts.find((a) => a.id === confirm);

  const doReset = (id: string) => {
    const pw = resetPasswordFor(id);
    const a = accounts.find((x) => x.id === id);
    if (pw && a) setTemp({ name: a.name, pw });
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader title="Users" subtitle="Everyone who has registered. Disable access, reset a password or promote someone to admin." />

      {open.length > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="section-title mb-2 flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-600" /> Password requests</h2>
          <ul className="space-y-2">
            {open.map((r) => {
              const a = accounts.find((x) => sameEmail(x.email, r.email));
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1"><span className="font-medium">{r.email}</span> <span className="text-xs text-gray-500">· {timeAgo(r.date)}</span></span>
                  {a && <button className="btn-primary !py-1.5" onClick={() => doReset(a.id)}>Set temporary password</button>}
                  <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" onClick={() => dismissRequest(r.id)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
          </div>
        </div>
        {members.length === 0 ? (
          <EmptyState icon={<Search className="h-6 w-6" />} title={q ? "No one matches that search" : "No members yet"} text={q ? undefined : "People who register will show up here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Last sign-in</th><th className="px-5 py-3">Active</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0"><p className="truncate font-medium text-gray-900">{u.name}</p><p className="truncate text-xs text-gray-600">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{u.phone ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-gray-600">{u.lastLogin ? timeAgo(u.lastLogin) : "Never"}</td>
                    <td className="px-5 py-3"><Toggle checked={u.active} label={`Toggle ${u.name}`} onChange={(v) => { const r = setActive(u.id, v); toast(r.ok ? (v ? "Account enabled" : "Account disabled") : r.error ?? "Failed", r.ok ? "info" : "error"); }} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600" title="Reset password" aria-label={`Reset password for ${u.name}`} onClick={() => doReset(u.id)}><KeyRound className="h-4 w-4" /></button>
                        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-violet-600" title="Make admin" aria-label={`Make ${u.name} an admin`} onClick={() => { const r = setRole(u.id, "admin"); toast(r.ok ? `${u.name} is now an admin` : r.error ?? "Failed", r.ok ? "success" : "error"); }}><ShieldPlus className="h-4 w-4" /></button>
                        <button className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-500" title="Delete" aria-label={`Delete ${u.name}`} onClick={() => setConfirm(u.id)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!target} onClose={() => setConfirm(null)} title="Delete this account?">
        <p className="text-sm text-gray-600">This permanently removes <span className="font-medium text-gray-900">{target?.name}</span> ({target?.email}) and all of their mail data. It can't be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => { if (target) { const r = deleteAccount(target.id); toast(r.ok ? "Account deleted" : r.error ?? "Failed", r.ok ? "info" : "error"); } setConfirm(null); }}>Delete account</button>
        </div>
      </Modal>

      <Modal open={!!temp} onClose={() => setTemp(null)} title="Temporary password">
        <p className="text-sm text-gray-600">Share this with <span className="font-medium text-gray-900">{temp?.name}</span>. It is only shown now — they can change it from their profile after signing in.</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <code className="flex-1 select-all font-mono text-base tracking-wider text-gray-900">{temp?.pw}</code>
          <button className="btn-ghost !px-3 !py-1.5" onClick={async () => { try { await navigator.clipboard.writeText(temp?.pw ?? ""); toast("Copied"); } catch { toast("Select and copy it manually", "error"); } }}><Copy className="h-4 w-4" /> Copy</button>
        </div>
        <div className="mt-5 flex justify-end"><button className="btn-primary" onClick={() => setTemp(null)}>Done</button></div>
      </Modal>
    </div>
  );
}
