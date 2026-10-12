import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PenLine, ClipboardPaste, UploadCloud, X, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../components/ui";
import { FormError } from "../components/AuthShell";
import { useStore } from "../store/useStore";
import { parseFile, parseRfc822 } from "../lib/parsers";
import { cn } from "../lib/utils";

type Tab = "upload" | "paste" | "manual";

const SAMPLE = `From: Jane Cooper <jane@acme.com>
To: you@mailmind.ai
Subject: Quotation needed urgently
Date: ${new Date().toUTCString()}

Hi,

Please send the updated quotation for 200 units by Friday. We are interested in bulk pricing and need it ASAP.

Thanks,
Jane Cooper`;

export default function ImportData() {
  const nav = useNavigate();
  const { importEmails, toast } = useStore();
  const myEmail = useStore((s) => s.user?.email ?? "");
  const [tab, setTab] = useState<Tab>("upload");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState("");
  const [form, setForm] = useState({ sender: "", senderEmail: "", receiver: myEmail, subject: "", body: "", date: new Date().toISOString().slice(0, 16) });

  const done = (n: number) => {
    setError(null);
    setSuccess(`${n} email${n === 1 ? "" : "s"} imported and sorted.`);
    toast(`${n} email${n === 1 ? "" : "s"} imported`);
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      let total = 0;
      for (const f of Array.from(files)) {
        const drafts = await parseFile(f);
        total += importEmails(drafts);
      }
      done(total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
  };

  const submitPaste = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!raw.trim()) return setError("Paste a raw email first.");
    try {
      done(importEmails([parseRfc822(raw)]));
      setRaw("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse email.");
    }
  };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.sender.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.senderEmail)) return setError("Enter a sender name and a valid sender email.");
    if (!form.subject.trim() || !form.body.trim()) return setError("Subject and body are required.");
    importEmails([{ ...form, date: new Date(form.date).toISOString() }]);
    done(1);
    setForm({ ...form, sender: "", senderEmail: "", subject: "", body: "" });
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "upload", label: "Upload files", icon: <UploadCloud className="h-4 w-4" /> },
    { key: "paste", label: "Paste raw email", icon: <ClipboardPaste className="h-4 w-4" /> },
    { key: "manual", label: "Create manually", icon: <PenLine className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageHeader title="Import mail" subtitle="Bring in emails from a file, paste a raw message, or write one by hand." />

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 px-2" role="tablist">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); setError(null); setSuccess(null); }}
              className={cn("flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium", tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900")}>
              {t.icon}<span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 p-5">
          <FormError text={error} />
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {success}
              <button className="ml-auto font-medium underline" onClick={() => nav("/inbox")}>View inbox</button>
              <button onClick={() => setSuccess(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
            </div>
          )}

          {tab === "upload" && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors", drag ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400")}
              >
                <UploadCloud className="mb-3 h-10 w-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{busy ? "Processing…" : "Drag & drop files here, or click to browse"}</p>
                <p className="mt-1 text-xs text-gray-600">.eml, .csv or .json · 5 MB max per file</p>
                <input ref={fileRef} type="file" accept=".eml,.csv,.json" multiple className="hidden" onChange={(e) => e.target.files && void handleFiles(e.target.files)} />
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-gray-700"><FileText className="h-3.5 w-3.5" /> Expected columns / keys</p>
                <code className="text-gray-700">sender, senderEmail, receiver, subject, body, date</code> (also accepts <code>from</code> / <code>to</code>)
              </div>
            </>
          )}

          {tab === "paste" && (
            <form onSubmit={submitPaste} className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="raw" className="label !mb-0">Raw RFC 822 email</label>
                <button type="button" className="text-xs font-medium text-blue-600 hover:underline" onClick={() => setRaw(SAMPLE)}>Insert sample</button>
              </div>
              <textarea id="raw" rows={12} className="input font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={"From: Name <name@example.com>\nTo: you@mailmind.ai\nSubject: Hello\nDate: Mon, 12 Oct 2026 09:00:00 +0500\n\nBody…"} />
              <button className="btn-primary" type="submit">Import email</button>
            </form>
          )}

          {tab === "manual" && (
            <form onSubmit={submitManual} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
              <div><label className="label" htmlFor="m-sender">Sender name</label><input id="m-sender" className="input" value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} /></div>
              <div><label className="label" htmlFor="m-semail">Sender email</label><input id="m-semail" type="email" className="input" value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} /></div>
              <div><label className="label" htmlFor="m-recv">Receiver</label><input id="m-recv" className="input" value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} /></div>
              <div><label className="label" htmlFor="m-date">Date</label><input id="m-date" type="datetime-local" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="m-subj">Subject</label><input id="m-subj" className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="m-body">Body</label><textarea id="m-body" rows={6} className="input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
              <div className="sm:col-span-2"><button className="btn-primary" type="submit">Add email</button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
