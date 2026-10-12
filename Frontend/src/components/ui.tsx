import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Info, X } from "lucide-react";
import type { Category, Priority, Sentiment } from "../lib/types";
import { avatarColor, categoryStyle, cn, initials, priorityStyle, sentimentStyle } from "../lib/utils";
import { useStore } from "../store/useStore";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", s, avatarColor(name))}>
      {initials(name)}
    </div>
  );
}

export const CategoryBadge = ({ value }: { value: Category }) => (
  <span className={cn("chip", categoryStyle[value])}>{value}</span>
);

export const PriorityBadge = ({ value }: { value: Priority }) => (
  <span className={cn("chip", priorityStyle[value])}>
    {(value === "High" || value === "Critical") && <AlertTriangle className="h-3 w-3" />}
    {value}
  </span>
);

export const SentimentBadge = ({ value, confidence }: { value: Sentiment; confidence?: number }) => (
  <span className={cn("chip", sentimentStyle[value])}>
    {value}
    {confidence !== undefined && <span className="opacity-80">· {confidence}%</span>}
  </span>
);

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        checked ? "bg-blue-600" : "bg-gray-200",
      )}
    >
      <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
        checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 bg-white hover:border-blue-500",
      )}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div className={cn("relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-pop", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-pop animate-rise"
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : t.tone === "error" ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <Info className="h-4 w-4 text-blue-600" />
          )}
          <span>{t.text}</span>
          <button onClick={() => dismiss(t.id)} className="ml-2 text-gray-400 hover:text-gray-600" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">{icon}</div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-gray-600">{text}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tone = "blue",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "blue" | "red" | "amber" | "emerald" | "violet" | "gray";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-100 text-red-500",
    amber: "bg-amber-100 text-amber-500",
    emerald: "bg-emerald-100 text-emerald-500",
    violet: "bg-violet-50 text-violet-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="card card-lift rise flex items-center gap-4 p-5">
      <div className={cn("flex h-12 w-12 shrink-0 -rotate-3 items-center justify-center rounded-2xl", tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-600">{label}</p>
        <p className="font-display text-3xl font-semibold leading-tight text-gray-900">{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}

/** A titled content block with a soft violet edge. */
export function InfoCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 border-l-[3px] border-l-violet-400 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="section-title text-violet-700">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
