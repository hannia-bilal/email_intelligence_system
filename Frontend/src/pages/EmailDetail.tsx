import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Mail,
  MailOpen,
  PenLine,
  Pencil,
  RefreshCw,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { InfoCard, Avatar, CategoryBadge, Checkbox, EmptyState, PriorityBadge, SentimentBadge } from "../components/ui";
import { useStore } from "../store/useStore";
import { TONES } from "../lib/types";
import { cn, formatDateTime } from "../lib/utils";

const FIELDS = ["Customer Name", "Company", "Phone", "Email", "Order Number", "Invoice Number", "Product", "Amount", "Meeting Date", "Location", "Requested Action"];

export default function EmailDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { emails, generating, toggleRead, toggleStar, archive, remove, toggleAction, setDraft, setTone, generateDraft, rejectDraft, approveDraft, toast } = useStore();
  const email = emails.find((e) => e.id === id && !e.deleted);

  const [detailed, setDetailed] = useState(false);
  const [openMsgs, setOpenMsgs] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);

  useEffect(() => {
    if (id) toggleRead(id, true);
    setEditing(false);
    setOpenMsgs({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!email) {
    return (
      <div className="p-6">
        <EmptyState icon={<Mail className="h-6 w-6" />} title="Email not found" text="It may have been deleted." />
        <div className="text-center"><Link to="/inbox" className="btn-primary">Back to inbox</Link></div>
      </div>
    );
  }

  const isGenerating = !!generating[email.id];
  const allOpen = email.thread.length > 0 && email.thread.every((m) => openMsgs[m.id]);
  const setAll = (v: boolean) => setOpenMsgs(Object.fromEntries(email.thread.map((m) => [m.id, v])));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email.draft);
      toast("Reply copied to clipboard");
    } catch {
      toast("Could not copy – select the text manually", "error");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <button className="btn-ghost" onClick={() => nav("/inbox")}><ArrowLeft className="h-4 w-4" /> Inbox</button>
        <div className="ml-auto flex items-center gap-1">
          <button className="btn-ghost" onClick={() => toggleRead(email.id, false)} title="Mark as unread"><MailOpen className="h-4 w-4" /><span className="hidden sm:inline">Mark unread</span></button>
          <button className="btn-ghost" onClick={() => toggleStar(email.id)} title="Star"><Star className={cn("h-4 w-4", email.starred && "fill-amber-400 text-amber-500")} /></button>
          <button className="btn-ghost" onClick={() => { archive(email.id); toast(email.archived ? "Moved to inbox" : "Email archived", "info"); }} title="Archive"><Archive className="h-4 w-4" /></button>
          <button className="btn-ghost text-red-500" onClick={() => { remove(email.id); nav("/inbox"); }} title="Delete"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Split screen */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-2 lg:items-start">
        {/* LEFT – original conversation */}
        <section className="card overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h1 className="text-lg font-semibold text-gray-900">{email.subject}</h1>
            <div className="mt-3 flex items-start gap-3">
              <Avatar name={email.sender} />
              <div className="min-w-0 text-sm">
                <p className="font-medium text-gray-900">{email.sender} <span className="font-normal text-gray-600">&lt;{email.senderEmail}&gt;</span></p>
                <p className="text-gray-600">To: {email.receiver}</p>
                <p className="text-xs text-gray-500">{formatDateTime(email.date)}</p>
              </div>
            </div>
          </div>

          {email.thread.length > 0 && (
            <div className="border-b border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Conversation ({email.thread.length} earlier)</p>
                <button className="text-xs font-medium text-blue-600 hover:underline" onClick={() => setAll(!allOpen)}>{allOpen ? "Collapse all" : "Expand all"}</button>
              </div>
              <ol className="relative space-y-2 border-l-2 border-gray-200 pl-4">
                {email.thread.map((m) => {
                  const open = !!openMsgs[m.id];
                  return (
                    <li key={m.id} className="relative">
                      <span className={cn("absolute -left-[22px] top-3 h-2.5 w-2.5 rounded-full border-2 border-white", m.isMe ? "bg-blue-600" : "bg-gray-400")} />
                      <div className="rounded-lg border border-gray-200 bg-white">
                        <button className="flex w-full items-center gap-2 px-3 py-2 text-left" onClick={() => setOpenMsgs((o) => ({ ...o, [m.id]: !open }))} aria-expanded={open}>
                          {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                          <span className="text-sm font-medium">{m.isMe ? "You" : m.from}</span>
                          {!open && <span className="min-w-0 flex-1 truncate text-xs text-gray-600">{m.body}</span>}
                          <span className="ml-auto shrink-0 text-xs text-gray-500">{formatDateTime(m.date)}</span>
                        </button>
                        {open && <p className="whitespace-pre-wrap border-t border-gray-100 px-4 py-3 text-sm text-gray-700">{m.body}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{email.body}</p>
          </div>
        </section>

        {/* RIGHT – analysis */}
        <section className="space-y-4">
          <InfoCard title="At a glance">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge value={email.category} />
              <PriorityBadge value={email.priority} />
              <SentimentBadge value={email.sentiment} confidence={email.sentimentConfidence} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-gray-600">Intent</dt><dd className="font-medium">{email.intent}</dd></div>
              <div><dt className="text-xs text-gray-600">Tone confidence</dt><dd className="font-medium">{email.sentimentConfidence}%</dd></div>
              <div><dt className="text-xs text-gray-600">Reply required</dt><dd className={cn("font-medium", email.replyRequired ? "text-amber-500" : "text-gray-700")}>{email.replyRequired ? (email.replied ? "Yes (replied)" : "Yes") : "No"}</dd></div>
              <div><dt className="text-xs text-gray-600">Action required</dt><dd className={cn("font-medium", email.actionRequired ? "text-amber-500" : "text-gray-700")}>{email.actionRequired ? "Yes" : "No"}</dd></div>
            </dl>
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="text-xs font-semibold text-gray-600">Why {email.priority.toUpperCase()} priority?</p>
              <p className="mt-0.5 text-gray-700">{email.priorityReason}</p>
            </div>
          </InfoCard>

          <InfoCard
            title="Summary"
            action={
              <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium" role="tablist">
                {(["Short", "Detailed"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={detailed === (t === "Detailed")} onClick={() => setDetailed(t === "Detailed")}
                    className={cn("rounded-md px-2.5 py-1", detailed === (t === "Detailed") ? "bg-white text-violet-600 shadow-sm" : "text-gray-600")}>{t}</button>
                ))}
              </div>
            }
          >
            <p className="text-sm leading-relaxed text-gray-800">{detailed ? email.summaryDetailed : email.summaryShort}</p>
          </InfoCard>

          <InfoCard title="Key details">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f} className="min-w-0">
                  <dt className="text-xs text-gray-600">{f}</dt>
                  <dd className={cn("truncate text-sm", email.extracted[f] ? "font-medium text-gray-900" : "text-gray-400")} title={email.extracted[f]}>{email.extracted[f] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </InfoCard>

          <InfoCard title="Action items & deadlines">
            {email.actions.length === 0 ? (
              <p className="text-sm text-gray-600">No action items detected.</p>
            ) : (
              <ul className="space-y-2.5">
                {email.actions.map((a) => {
                  const done = a.status === "Completed";
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className="mt-0.5"><Checkbox checked={done} onChange={() => toggleAction(email.id, a.id)} /></div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", done ? "text-gray-500 line-through" : "text-gray-900")}>{a.text}</p>
                        {(a.deadlineLabel || a.deadline) && (
                          <p className="text-xs text-gray-600">
                            Deadline: {a.deadlineLabel}
                            {a.deadline && <span className="text-gray-500"> → {new Date(a.deadline).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>}
                          </p>
                        )}
                      </div>
                      <span className={cn("chip", done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{a.status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </InfoCard>
        </section>
      </div>

      {/* Smart reply console */}
      <div className="shrink-0 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(16,24,40,0.04)]">
        <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left sm:px-6" onClick={() => setConsoleOpen(!consoleOpen)} aria-expanded={consoleOpen}>
          <PenLine className="h-4 w-4 text-violet-500" />
          <span className="font-display text-sm font-semibold text-violet-700">Reply</span>
          <span className="text-xs text-gray-500">Drafts are only sent after you approve them</span>
          <ChevronDown className={cn("ml-auto h-4 w-4 text-gray-500 transition-transform", !consoleOpen && "-rotate-90")} />
        </button>
        {consoleOpen && (
          <div className="space-y-3 px-4 pb-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Reply tone">
              {TONES.map((t) => (
                <button key={t} role="radio" aria-checked={email.draftTone === t}
                  onClick={() => { setTone(email.id, t); if (email.draft) generateDraft(email.id, t); }}
                  className={cn("chip border px-3 py-1", email.draftTone === t ? "border-violet-500 bg-violet-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}>{t}</button>
              ))}
            </div>

            <textarea
              value={isGenerating ? "" : email.draft}
              readOnly={!editing}
              onChange={(e) => setDraft(email.id, e.target.value)}
              placeholder={isGenerating ? "Writing a draft…" : "No draft yet. Click “Write a draft” and we'll start one based on the whole conversation."}
              rows={6}
              className={cn("input resize-y leading-relaxed", !editing && "bg-gray-50", editing && "border-blue-500 ring-2 ring-blue-500/20")}
              aria-label="Reply draft"
            />

            <div className="flex flex-wrap items-center gap-2">
              {!email.draft ? (
                <button className="btn-ai" onClick={() => generateDraft(email.id)} disabled={isGenerating}>
                  <PenLine className="h-4 w-4" /> {isGenerating ? "Writing…" : "Write a draft"}
                </button>
              ) : (
                <>
                  <button className="btn-ghost" onClick={() => generateDraft(email.id)} disabled={isGenerating}><RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} /> Rewrite</button>
                  <button className="btn-ghost" onClick={() => setEditing(!editing)}><Pencil className="h-4 w-4" /> {editing ? "Done editing" : "Edit"}</button>
                  <button className="btn-ghost" onClick={copy}><Copy className="h-4 w-4" /> Copy</button>
                  <div className="ml-auto flex gap-2">
                    <button className="btn-ghost text-red-500" onClick={() => { rejectDraft(email.id); setEditing(false); }}><X className="h-4 w-4" /> Reject</button>
                    <button className="btn-primary" onClick={() => { approveDraft(email.id); setEditing(false); }}><Check className="h-4 w-4" /><Send className="h-4 w-4" /> Approve & send</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
