import type { Category, Priority, Sentiment } from "./types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const uid = () => Math.random().toString(36).slice(2, 10);

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function listDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];
export function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export const priorityStyle: Record<Priority, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-600",
  Critical: "bg-red-500 text-white",
};

export const sentimentStyle: Record<Sentiment, string> = {
  Positive: "bg-emerald-100 text-emerald-700",
  Neutral: "bg-gray-100 text-gray-600",
  Negative: "bg-red-100 text-red-600",
  Angry: "bg-red-500 text-white",
  Urgent: "bg-amber-100 text-amber-700",
};

export const categoryStyle: Record<Category, string> = {
  "Sales Inquiry": "bg-blue-50 text-blue-700",
  "Customer Complaint": "bg-red-50 text-red-600",
  "Support Request": "bg-cyan-50 text-cyan-700",
  "Meeting Request": "bg-indigo-50 text-indigo-700",
  "Invoice / Payment": "bg-emerald-50 text-emerald-700",
  "Job Application": "bg-pink-50 text-pink-700",
  "General Information": "bg-gray-100 text-gray-600",
  Spam: "bg-gray-100 text-gray-500",
  Urgent: "bg-red-50 text-red-600",
  Other: "bg-gray-100 text-gray-600",
};

// Chart colours (categorical, readable on white)
export const CATEGORY_CHART_COLORS: Record<Category, string> = {
  "Sales Inquiry": "#2563EB",
  "Customer Complaint": "#EF4444",
  "Support Request": "#06B6D4",
  "Meeting Request": "#6366F1",
  "Invoice / Payment": "#10B981",
  "Job Application": "#EC4899",
  "General Information": "#9CA3AF",
  Spam: "#D1D5DB",
  Urgent: "#F59E0B",
  Other: "#A78BFA",
};
