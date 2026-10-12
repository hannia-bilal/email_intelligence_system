import { useState, type FormEvent } from "react";
import { PageHeader, Toggle } from "../../components/ui";
import { FormError } from "../../components/AuthShell";
import { useStore } from "../../store/useStore";

export default function AdminSettings() {
  const { settings, setSettings, changePassword, toast, user } = useStore();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    const r = changePassword(cur, next);
    if (!r.ok) return setError(r.error ?? "Could not change password.");
    setError(null); setCur(""); setNext("");
    toast("Password changed");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <PageHeader title="Settings" subtitle="Registration and your own admin account." />

      <section className="card p-5">
        <h2 className="section-title mb-1">Registration</h2>
        <div className="flex items-center justify-between gap-4 py-2">
          <div><p className="text-sm font-medium text-gray-900">Allow new sign-ups</p><p className="text-xs text-gray-600">When off, the Create account page is closed to visitors.</p></div>
          <Toggle checked={settings.allowSignups} label="Allow new sign-ups" onChange={(v) => setSettings({ allowSignups: v })} />
        </div>
      </section>

      <form onSubmit={save} className="card space-y-4 p-5" noValidate>
        <h2 className="section-title">Change my password</h2>
        <p className="-mt-2 text-xs text-gray-600">Signed in as {user?.email}</p>
        <FormError text={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="s-cur">Current password</label><input id="s-cur" type="password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="s-new">New password</label><input id="s-new" type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></div>
        </div>
        <button className="btn-primary" type="submit">Update password</button>
      </form>
    </div>
  );
}
