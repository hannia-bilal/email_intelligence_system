/** Hand-drawn style envelope mark. */
export function LogoMark({ className = "h-9 w-9", tone = "blue" }: { className?: string; tone?: "blue" | "light" }) {
  const bg = tone === "blue" ? "#2563EB" : "#FFFFFF";
  const fg = tone === "blue" ? "#FFFFFF" : "#2563EB";
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="10" fill={bg} />
      <rect x="7" y="10.5" width="22" height="16" rx="3.5" fill="none" stroke={fg} strokeWidth="2.2" />
      <path d="M8 13.5 18 20.5l10-7" fill="none" stroke={fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="9" r="3.6" fill="#8B5CF6" stroke={bg} strokeWidth="1.8" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return <span className={`font-display text-[22px] font-semibold tracking-tight ${light ? "text-white" : "text-gray-900"}`}>MailMind</span>;
}
