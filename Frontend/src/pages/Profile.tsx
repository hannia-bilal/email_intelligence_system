import { useState, type FormEvent } from "react";
import { Avatar, PageHeader, Toggle } from "../components/ui";
import { FormError } from "../components/AuthShell";
import { useStore } from "../store/useStore";
import type { NotificationPrefs } from "../lib/types";

const PREFS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "urgent", label: "New urgent email", desc: "When an incoming email is flagged High or Critical" },
  { key: "complaint", label: "Customer complaint", desc: "When a complaint or angry sentiment is detected" },
  { key: "reply", label: "Email requiring reply", desc: "When an email needs your response" },
  { key: "deadline", label: "Upcoming deadline", desc: "Reminders for deadlines found in emails" },
  { key: "action", label: "Important action item", desc: "When a new action item is extracted" },
  { key: "ai", label: "Import finished", desc: "When an import has been sorted into your inbox" },
];

export default function Profile() {
  const { user, updateProfile, changePassword, prefs, setPrefs, toast } = useStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setProfileError("Name is too short.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setProfileError("Enter a valid email address.");
    if (phone.trim() && !(/^\+?[\d\s\-()]{7,20}$/.test(phone.trim()) && phone.replace(/\D/g, "").length >= 7)) return setProfileError("That phone number doesn't look right.");
    const r = updateProfile({ name: name.trim(), email: email.trim(), phone });
    if (!r.ok) return setProfileError(r.error ?? "Could not save.");
    setProfileError(null);
    toast("Profile updated");
  };

  const savePw = (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setPwError("New password must be at least 8 characters.");
    const r = changePassword(cur, next);
    if (!r.ok) return setPwError(r.error ?? "Could not change password.");
    setPwError(null);
    setCur("");
    setNext("");
    toast("Password changed");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader title="Profile & settings" subtitle="Manage your account and notification preferences." />

      <form onSubmit={saveProfile} className="card space-y-4 p-5" noValidate>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? "U"} size="lg" />
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
        <FormError text={profileError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="p-name">Name</label><input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label" htmlFor="p-email">Email</label><input id="p-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label" htmlFor="p-phone">Phone <span className="font-normal text-gray-400">(optional)</span></label><input id="p-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
        <button className="btn-primary" type="submit">Save changes</button>
      </form>

      <form onSubmit={savePw} className="card space-y-4 p-5" noValidate>
        <h2 className="section-title">Change password</h2>
        <FormError text={pwError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="p-cur">Current password</label><input id="p-cur" type="password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="p-new">New password</label><input id="p-new" type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></div>
        </div>
        <button className="btn-primary" type="submit">Update password</button>
      </form>

      <div className="card p-5">
        <h2 className="section-title mb-1">Notification preferences</h2>
        <p className="mb-3 text-sm text-gray-600">Choose which events create notifications.</p>
        <ul className="divide-y divide-gray-100">
          {PREFS.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-4 py-3">
              <div><p className="text-sm font-medium text-gray-900">{p.label}</p><p className="text-xs text-gray-600">{p.desc}</p></div>
              <Toggle checked={prefs[p.key]} label={p.label} onChange={(v) => setPrefs({ [p.key]: v })} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
