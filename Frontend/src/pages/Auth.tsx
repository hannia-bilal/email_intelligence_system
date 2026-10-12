import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import AuthShell, { FormError } from "../components/AuthShell";
import { useStore } from "../store/useStore";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneOk = (v: string) => /^\+?[\d\s\-()]{7,20}$/.test(v.trim()) && v.replace(/\D/g, "").length >= 7;

function PasswordInput({ value, onChange, id, placeholder, autoComplete = "current-password" }: { value: string; onChange: (v: string) => void; id: string; placeholder?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="input pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Your password"}
        autoComplete={autoComplete}
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Login() {
  const nav = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(email) || !password) return setError("Enter your email and password.");
    const r = login(email, password);
    if (!r.ok) return setError(r.error ?? "Incorrect email or password.");
    nav(r.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={<>New to MailMind? <Link to="/signup" className="font-semibold text-blue-600 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError text={error} />
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="username" autoFocus />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={setPassword} />
        </div>
        <button className="btn-primary w-full !py-2.5" type="submit">Sign in</button>
      </form>
    </AuthShell>
  );
}

export function SignUp() {
  const nav = useNavigate();
  const signup = useStore((s) => s.signup);
  const open = useStore((s) => s.settings.allowSignups);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (phone.trim() && !phoneOk(phone)) return setError("That phone number doesn't look right. Leave it empty if you'd rather not add one.");
    if (!emailOk(email)) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    const r = signup({ name: name.trim(), phone, email: email.trim(), password });
    if (!r.ok) return setError(r.error ?? "Could not create your account.");
    nav("/dashboard", { replace: true });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link></>}
    >
      {!open ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">New sign-ups are paused right now. Please check back soon.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError text={error} />
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" autoFocus />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone number <span className="font-normal text-gray-400">(optional)</span></label>
            <input id="phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <PasswordInput id="password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <button className="btn-primary w-full !py-2.5" type="submit">Create account</button>
        </form>
      )}
    </AuthShell>
  );
}

export function ForgotPassword() {
  const requestReset = useStore((s) => s.requestReset);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) return setError("Please enter a valid email address.");
    requestReset(email);
    setSent(true);
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Tell us your email and we'll get you back in."
      footer={<Link to="/login" className="font-semibold text-blue-600 hover:underline">← Back to sign in</Link>}
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><MailCheck className="h-5 w-5" /></div>
          <p className="mt-3 font-display text-lg font-semibold text-gray-900">Request received</p>
          <p className="mt-1 text-sm text-gray-600">If an account exists for <span className="font-medium text-gray-900">{email}</span>, an administrator will send you a temporary password.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <FormError text={error} />
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
          </div>
          <button className="btn-primary w-full !py-2.5" type="submit">Send request</button>
        </form>
      )}
    </AuthShell>
  );
}
