import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, ArchiveRestore, Filter, Mail, MailOpen, Search, Star, Trash2, X, ExternalLink } from "lucide-react";
import { Avatar, CategoryBadge, EmptyState, PageHeader, PriorityBadge, SentimentBadge } from "../components/ui";
import { useStore } from "../store/useStore";
import { smartSearch } from "../lib/mockAi";
import { CATEGORIES, SENTIMENTS, type Category, type Email, type Sentiment } from "../lib/types";
import { cn, listDate } from "../lib/utils";

type Quick = "unread" | "urgent" | "reply" | "action" | "starred";
const QUICK: { key: Quick; label: string }[] = [
  { key: "unread", label: "Unread" },
  { key: "urgent", label: "Urgent" },
  { key: "reply", label: "Reply required" },
  { key: "action", label: "Action required" },
  { key: "starred", label: "Starred" },
];

const inRange = (iso: string, range: string) => {
  if (range === "any") return true;
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (range === "today") return new Date(iso).toDateString() === new Date().toDateString();
  if (range === "week") return diff <= 7 * day;
  if (range === "month") return diff <= 30 * day;
  return true;
};

function Row({ e }: { e: Email }) {
  const nav = useNavigate();
  const { toggleRead, toggleStar, archive, remove } = useStore();
  const act = (fn: () => void) => (ev: React.MouseEvent) => {
    ev.stopPropagation();
    fn();
  };
  return (
    <li
      onClick={() => { toggleRead(e.id, true); nav(`/inbox/${e.id}`); }}
      className={cn("group relative flex cursor-pointer gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50", !e.read && "bg-blue-50/30")}
    >
      {!e.read && <span className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-600" aria-label="Unread" />}
      <Avatar name={e.sender} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate text-sm", e.read ? "text-gray-700" : "font-semibold text-gray-900")}>{e.sender}</p>
          <span className="shrink-0 text-xs text-gray-500">{listDate(e.date)}</span>
        </div>
        <p className={cn("truncate text-sm", e.read ? "text-gray-700" : "font-medium text-gray-900")}>{e.subject}</p>
        <p className="truncate text-sm text-gray-600">{e.body.replace(/\s+/g, " ")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn("chip", e.read ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700")}>{e.read ? "Read" : "Unread"}</span>
          <CategoryBadge value={e.category} />
          <PriorityBadge value={e.priority} />
          {e.replyRequired && !e.replied && <span className="chip bg-amber-100 text-amber-700">Reply needed</span>}
          {e.replied && <span className="chip bg-emerald-100 text-emerald-700">Replied</span>}
          <span className="hidden sm:inline-flex"><SentimentBadge value={e.sentiment} /></span>
        </div>
      </div>

      {/* Hover quick actions */}
      <div className="absolute right-3 top-2 hidden items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-card group-hover:flex">
        <button className="rounded p-1.5 text-gray-600 hover:bg-gray-100" title="Open" aria-label="Open" onClick={act(() => nav(`/inbox/${e.id}`))}><ExternalLink className="h-4 w-4" /></button>
        <button className="rounded p-1.5 text-gray-600 hover:bg-gray-100" title={e.read ? "Mark unread" : "Mark read"} aria-label="Toggle read" onClick={act(() => toggleRead(e.id))}>
          {e.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
        </button>
        <button className="rounded p-1.5 text-gray-600 hover:bg-gray-100" title="Star" aria-label="Star" onClick={act(() => toggleStar(e.id))}>
          <Star className={cn("h-4 w-4", e.starred && "fill-amber-400 text-amber-500")} />
        </button>
        <button className="rounded p-1.5 text-gray-600 hover:bg-gray-100" title={e.archived ? "Unarchive" : "Archive"} aria-label="Archive" onClick={act(() => archive(e.id))}>
          {e.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
        </button>
        <button className="rounded p-1.5 text-red-500 hover:bg-red-100" title="Delete" aria-label="Delete" onClick={act(() => remove(e.id))}><Trash2 className="h-4 w-4" /></button>
      </div>
      {e.starred && <Star className="absolute right-4 top-4 h-4 w-4 fill-amber-400 text-amber-500 group-hover:hidden" />}
    </li>
  );
}

export default function Inbox() {
  const { emails, globalQuery, setGlobalQuery } = useStore();
  const [quick, setQuick] = useState<Quick[]>([]);
  const [category, setCategory] = useState<Category | "all">("all");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");
  const [range, setRange] = useState("any");
  const [sender, setSender] = useState("");
  const [view, setView] = useState<"inbox" | "archived">("inbox");
  const [showFilters, setShowFilters] = useState(false);

  const search = useMemo(() => smartSearch(globalQuery, emails), [globalQuery, emails]);

  const list = useMemo(() => {
    const ids = new Set(search.ids);
    return emails
      .filter((e) => !e.deleted && ids.has(e.id))
      .filter((e) => (view === "archived" ? e.archived : !e.archived))
      .filter((e) => !quick.includes("unread") || !e.read)
      .filter((e) => !quick.includes("urgent") || e.priority === "High" || e.priority === "Critical")
      .filter((e) => !quick.includes("reply") || (e.replyRequired && !e.replied))
      .filter((e) => !quick.includes("action") || e.actions.some((a) => a.status === "Pending") || e.actionRequired)
      .filter((e) => !quick.includes("starred") || e.starred)
      .filter((e) => category === "all" || e.category === category)
      .filter((e) => sentiment === "all" || e.sentiment === sentiment)
      .filter((e) => inRange(e.date, range))
      .filter((e) => !sender || `${e.sender} ${e.senderEmail}`.toLowerCase().includes(sender.toLowerCase()))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [emails, search, quick, category, sentiment, range, sender, view]);

  const activeCount = quick.length + (category !== "all" ? 1 : 0) + (sentiment !== "all" ? 1 : 0) + (range !== "any" ? 1 : 0) + (sender ? 1 : 0);
  const reset = () => { setQuick([]); setCategory("all"); setSentiment("all"); setRange("any"); setSender(""); };
  const toggleQuick = (k: Quick) => setQuick((q) => (q.includes(k) ? q.filter((x) => x !== k) : [...q, k]));

  const FilterPanel = (
    <div className="card space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Filters</h2>
        {activeCount > 0 && <button onClick={reset} className="text-xs font-medium text-blue-600 hover:underline">Clear all</button>}
      </div>
      <div>
        <p className="label">Quick filters</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setQuick([])} className={cn("chip border", quick.length === 0 ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}>All</button>
          {QUICK.map((q) => (
            <button key={q.key} onClick={() => toggleQuick(q.key)} className={cn("chip border", quick.includes(q.key) ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="f-cat">Category</label>
        <select id="f-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category | "all")}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="f-sent">Sentiment</label>
        <select id="f-sent" className="input" value={sentiment} onChange={(e) => setSentiment(e.target.value as Sentiment | "all")}>
          <option value="all">Any sentiment</option>
          {SENTIMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="f-date">Date</label>
        <select id="f-date" className="input" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="any">Any time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="f-sender">Sender</label>
        <input id="f-sender" className="input" placeholder="Name or email" value={sender} onChange={(e) => setSender(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <PageHeader
        title="Inbox"
        subtitle={`${list.length} email${list.length === 1 ? "" : "s"}`}
        actions={
          <button className="btn-ghost lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filters{activeCount > 0 && ` (${activeCount})`}
          </button>
        }
      />

      {globalQuery && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
          <Search className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-blue-700">Search: “{globalQuery}”</p>
            <p className="text-xs text-gray-600">{search.explanation ? `Showing: ${search.explanation}.` : "Searching sender, subject, body and category."}</p>
          </div>
          <button onClick={() => setGlobalQuery("")} aria-label="Clear search" className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <div className={cn(showFilters ? "block" : "hidden", "lg:block")}>{FilterPanel}</div>

        <div className="card overflow-hidden">
          <div className="flex border-b border-gray-200 px-2">
            {(["inbox", "archived"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("border-b-2 px-4 py-3 text-sm font-medium capitalize", view === v ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900")}
              >
                {v}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyState icon={<Mail className="h-6 w-6" />} title="Nothing here" text="Try clearing a filter, changing your search, or import some mail." />
          ) : (
            <ul className="divide-y divide-gray-100">{list.map((e) => <Row key={e.id} e={e} />)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
