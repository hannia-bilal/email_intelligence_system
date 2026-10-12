import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldMinus, UserPlus } from "lucide-react";
import { Avatar, PageHeader, Toggle } from "../../components/ui";
import { FormError } from "../../components/AuthShell";
import { useStore } from "../../store/useStore";
import { formatDate } from "../../lib/utils";

export default function Admins() {
  const { accounts, user, addAdmin, setRole, setActive, toast } = useStore();
  const admins = accounts.filter((a) => a.role === "admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = addAdmin({ name, email, password });
    if (!r.ok) return setError(r.error ?? "Could not add admin.");
    setError(null);
    toast(`${name.trim()} can now sign in as an admin`);
    setName(""); setEmail(""); setPassword("");
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader title="Admins" subtitle="People who can sign in to this console. Admins use the same sign-in page as everyone else." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="card space-y-4 p-5 lg:col-span-2 lg:self-start" noValidate>
          <h2 className="section-title flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-600" /> Add an admin</h2>
          <FormError text={error} />
          <div><label className="label" htmlFor="a-name">Full name</label><input id="a-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></div>
          <div><label className="label" htmlFor="a-email">Email</label><input id="a-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></div>
          <div>
            <label className="label" htmlFor="a-pw">Password</label>
            <div className="relative">
              <input id="a-pw" type={show ? "text" : "password"} className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <button className="btn-primary w-full" type="submit">Add admin</button>
          <p className="text-xs text-gray-500">You can also promote someone who has already registered from the Users page.</p>
        </form>

        <section className="card overflow-hidden lg:col-span-3">
          <div className="border-b border-gray-200 px-5 py-4"><h2 className="section-title">Current admins ({admins.length})</h2></div>
          <ul className="divide-y divide-gray-100">
            {admins.map((a) => {
              const locked = a.isDefault || a.id === user?.id;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Avatar name={a.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {a.name}
                      {a.isDefault && <span className="chip ml-2 bg-blue-50 text-blue-700">Main admin</span>}
                      {a.id === user?.id && !a.isDefault && <span className="chip ml-2 bg-gray-100 text-gray-600">You</span>}
                    </p>
                    <p className="truncate text-xs text-gray-600">{a.email} · added {formatDate(a.createdAt)}</p>
                  </div>
                  {!locked && (
                    <>
                      <Toggle checked={a.active} label={`Toggle ${a.name}`} onChange={(v) => { const r = setActive(a.id, v); toast(r.ok ? (v ? "Admin enabled" : "Admin disabled") : r.error ?? "Failed", r.ok ? "info" : "error"); }} />
                      <button className="btn-ghost !py-1.5 text-red-500" onClick={() => { const r = setRole(a.id, "user"); toast(r.ok ? "Admin rights removed" : r.error ?? "Failed", r.ok ? "info" : "error"); }}><ShieldMinus className="h-4 w-4" /> Remove</button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
