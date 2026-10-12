import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "./Logo";

function Stack() {
  // a little pile of letters – purely decorative
  return (
    <svg viewBox="0 0 360 280" className="w-full max-w-[380px]" aria-hidden="true">
      <g transform="rotate(-7 180 140)">
        <rect x="46" y="58" width="236" height="150" rx="16" fill="#fff" opacity="0.18" />
      </g>
      <g transform="rotate(4 180 140)">
        <rect x="70" y="70" width="236" height="150" rx="16" fill="#fff" opacity="0.30" />
      </g>
      <g>
        <rect x="58" y="82" width="244" height="156" rx="16" fill="#fff" />
        <path d="M66 98 180 172l114-74" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="86" y="190" width="92" height="7" rx="3.5" fill="#E5E7EB" />
        <rect x="86" y="206" width="62" height="7" rx="3.5" fill="#E5E7EB" />
        <circle cx="282" cy="86" r="22" fill="#8B5CF6" stroke="#2563EB" strokeWidth="6" />
        <path d="M273 86l7 7 12-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      {/* brand side */}
      <aside className="relative hidden overflow-hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/60" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-blue-700/50" />
        <div className="relative flex items-center gap-2.5">
          <LogoMark tone="light" className="h-10 w-10" />
          <Wordmark light />
        </div>
        <div className="relative my-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">Your inbox, in order</p>
          <h2 className="mt-3 max-w-md font-display text-[44px] font-semibold leading-[1.08] text-white">
            Less sorting.
            <br />
            More replying.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-blue-100">
            MailMind reads the pile, flags what's urgent and keeps track of who is waiting on you — so your day starts with answers, not triage.
          </p>
          <div className="mt-10"><Stack /></div>
        </div>
        <p className="relative text-xs text-blue-200">© {new Date().getFullYear()} MailMind</p>
      </aside>

      {/* form side */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark className="h-9 w-9" />
            <Wordmark />
          </div>
          <h1 className="text-[32px] font-semibold leading-tight text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-gray-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-7 text-sm text-gray-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function FormError({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
      {text}
    </div>
  );
}
