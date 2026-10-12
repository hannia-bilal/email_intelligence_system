import { CATEGORIES, type Category, type Email, type Sentiment } from "./types";

export const live = (emails: Email[]) => emails.filter((e) => !e.deleted);

export function dailyVolume(emails: Email[], days = 7, filter?: (e: Email) => boolean) {
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const count = live(emails).filter((e) => new Date(e.date).toDateString() === key && (!filter || filter(e))).length;
    out.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), count });
  }
  return out;
}

export function categoryCounts(emails: Email[]) {
  return CATEGORIES.map((c) => ({
    name: c as Category,
    value: live(emails).filter((e) => e.category === c).length,
  })).filter((c) => c.value > 0);
}

export function sentimentTrend(emails: Email[], days = 7) {
  const rows: Record<string, string | number>[] = [];
  const sentiments: Sentiment[] = ["Positive", "Neutral", "Negative", "Angry"];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const row: Record<string, string | number> = { day: d.toLocaleDateString(undefined, { weekday: "short" }) };
    for (const s of sentiments) {
      row[s] = live(emails).filter((e) => new Date(e.date).toDateString() === key && e.sentiment === s).length;
    }
    rows.push(row);
  }
  return rows;
}

export function summaryStats(emails: Email[]) {
  const l = live(emails).filter((e) => !e.archived);
  return {
    total: l.length,
    unread: l.filter((e) => !e.read).length,
    urgent: l.filter((e) => e.priority === "High" || e.priority === "Critical").length,
    replyRequired: l.filter((e) => e.replyRequired && !e.replied).length,
    customer: l.filter((e) => ["Customer Complaint", "Support Request", "Invoice / Payment"].includes(e.category)).length,
    sales: l.filter((e) => e.category === "Sales Inquiry").length,
    support: l.filter((e) => e.category === "Support Request").length,
    pendingActions: l.reduce((n, e) => n + e.actions.filter((a) => a.status === "Pending").length, 0),
  };
}
