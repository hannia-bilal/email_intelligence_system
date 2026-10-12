import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";

const SUGGESTIONS = [
  "Which emails need my reply?",
  "Show all urgent customer complaints",
  "What are today's pending actions?",
  "Which emails mention payment?",
  "Summarize today's important emails",
  "Which customers are waiting for a response?",
];

export default function Assistant() {
  const { chat, ask, clearChat, emails } = useStore();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    if (chat[chat.length - 1]?.role === "assistant") setThinking(false);
  }, [chat]);

  const send = (q: string) => {
    if (!q.trim()) return;
    setThinking(true);
    ask(q);
    setText("");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col p-4 sm:p-6">
      <PageHeader
        title="Ask your inbox"
        subtitle="Plain questions, answered from your own emails."
        actions={<button className="btn-ghost" onClick={clearChat}><Trash2 className="h-4 w-4" /> Clear</button>}
      />

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {chat.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600"><MessageCircle className="h-4 w-4" /></div>
              )}
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm border border-violet-100 bg-violet-50 text-gray-900")}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                {m.emailIds && m.emailIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.emailIds.map((id) => {
                      const e = emails.find((x) => x.id === id);
                      if (!e) return null;
                      return (
                        <Link key={id} to={`/inbox/${id}`} className="chip border border-violet-200 bg-white text-violet-700 hover:bg-violet-100">
                          {e.sender}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600"><MessageCircle className="h-4 w-4 animate-pulse" /></div>
              <div className="rounded-2xl rounded-bl-sm border border-violet-100 bg-violet-50 px-4 py-2.5 text-sm text-gray-600">Looking through your inbox…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="chip shrink-0 border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700 hover:bg-violet-100">
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your emails…" aria-label="Ask about your inbox" />
            <button className="btn-ai" type="submit" disabled={!text.trim()}><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></button>
          </form>
        </div>
      </div>
    </div>
  );
}
