/**
 * Front-end-only mock of the AI pipeline.
 * Every function here is a stand-in for a backend endpoint (see README "Wiring the backend").
 * Replace the bodies with fetch() calls to your FastAPI routes and the UI will not need to change.
 */
import type { ActionItem, Category, Email, Priority, Sentiment, Tone } from "./types";
import { uid } from "./utils";

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

export function classify(subject: string, body: string) {
  const t = `${subject} ${body}`.toLowerCase();
  let category: Category = "General Information";
  let intent = "Sharing information";

  if (has(t, ["lottery", "winner", "click here", "free gift", "crypto giveaway", "unsubscribe now"])) {
    category = "Spam";
    intent = "Unsolicited promotion";
  } else if (has(t, ["refund", "damaged", "wrong product", "not happy", "complaint", "unacceptable", "terrible"])) {
    category = "Customer Complaint";
    intent = has(t, ["refund"]) ? "Requesting refund" : "Reporting a problem";
  } else if (has(t, ["invoice", "payment", "paid", "billing", "overdue"])) {
    category = "Invoice / Payment";
    intent = "Payment follow-up";
  } else if (has(t, ["resume", "cv", "apply", "application for", "position"])) {
    category = "Job Application";
    intent = "Applying for a role";
  } else if (has(t, ["meeting", "call", "schedule", "calendar", "demo"])) {
    category = "Meeting Request";
    intent = "Scheduling a meeting";
  } else if (has(t, ["quote", "quotation", "pricing", "price", "interested in", "bulk"])) {
    category = "Sales Inquiry";
    intent = "Requesting pricing";
  } else if (has(t, ["help", "issue", "error", "not working", "can't login", "cannot login", "support"])) {
    category = "Support Request";
    intent = "Needs technical help";
  }
  if (has(t, ["urgent", "asap", "immediately", "critical"]) && category === "General Information") {
    category = "Urgent";
    intent = "Needs immediate attention";
  }

  let sentiment: Sentiment = "Neutral";
  let confidence = 78;
  if (has(t, ["furious", "unacceptable", "worst", "outraged", "ridiculous"])) {
    sentiment = "Angry";
    confidence = 93;
  } else if (has(t, ["disappointed", "damaged", "wrong", "problem", "not happy", "late"])) {
    sentiment = "Negative";
    confidence = 88;
  } else if (has(t, ["urgent", "asap", "immediately"])) {
    sentiment = "Urgent";
    confidence = 84;
  } else if (has(t, ["thank", "great", "love", "excited", "appreciate", "pleased"])) {
    sentiment = "Positive";
    confidence = 90;
  }

  let priority: Priority = "Low";
  let reason = "No time pressure or risk detected in the message.";
  if (has(t, ["critical", "legal", "lawsuit", "outage"])) {
    priority = "Critical";
    reason = "Message mentions a critical issue with potential legal or operational impact.";
  } else if (has(t, ["urgent", "asap", "24 hours", "immediately", "refund", "overdue"]) || sentiment === "Angry") {
    priority = "High";
    reason = "Sender expects a fast response or reports a financial / service problem.";
  } else if (has(t, ["by friday", "tomorrow", "next week", "deadline", "meeting", "quote"])) {
    priority = "Medium";
    reason = "A near-term deadline or business opportunity is mentioned.";
  }
  if (category === "Spam") {
    priority = "Low";
    reason = "Looks like unsolicited promotional content.";
  }

  const replyRequired = !["Spam", "General Information"].includes(category) || t.includes("?");
  const actionRequired = ["Customer Complaint", "Invoice / Payment", "Sales Inquiry", "Meeting Request", "Support Request", "Urgent"].includes(category);

  return { category, intent, sentiment, sentimentConfidence: confidence, priority, priorityReason: reason, replyRequired, actionRequired };
}

export function extractInfo(from: string, fromEmail: string, subject: string, body: string) {
  const out: Record<string, string> = {};
  const text = `${subject}\n${body}`;
  out["Customer Name"] = from;
  out["Email"] = fromEmail;
  const company = fromEmail.split("@")[1]?.split(".")[0];
  if (company && !["gmail", "yahoo", "outlook", "hotmail"].includes(company)) {
    out["Company"] = company.charAt(0).toUpperCase() + company.slice(1);
  }
  const phone = text.match(/(\+?\d[\d\s-]{8,}\d)/);
  if (phone) out["Phone"] = phone[1].trim();
  const order = text.match(/order\s*(?:no\.?|number|#)?\s*#?(\d{3,})/i);
  if (order) out["Order Number"] = `#${order[1]}`;
  const inv = text.match(/(?:invoice|inv)\s*(?:no\.?|number|#)?\s*#?([A-Z0-9-]{3,})/i);
  if (inv) out["Invoice Number"] = inv[1];
  const amt = text.match(/(?:\$|usd\s?|rs\.?\s?|pkr\s?)\s?([\d,]+(?:\.\d+)?)/i);
  if (amt) out["Amount"] = amt[0].trim();
  const date = text.match(/\b(\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December))\b/i);
  if (date) out["Meeting Date"] = date[1];
  return out;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Convert natural-language deadlines to structured ISO dates. */
export function parseDeadline(label: string, from = new Date()): string | undefined {
  const l = label.toLowerCase().trim();
  const d = new Date(from);
  d.setHours(17, 0, 0, 0);
  if (l === "today") return d.toISOString();
  if (l === "tomorrow") { d.setDate(d.getDate() + 1); return d.toISOString(); }
  const within = l.match(/within (\d+) days?/);
  if (within) { d.setDate(d.getDate() + Number(within[1])); return d.toISOString(); }
  if (l.includes("end of this month") || l.includes("end of month")) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 17, 0, 0).toISOString();
  }
  const next = l.match(/next (\w+)/);
  const wd = WEEKDAYS.findIndex((w) => l.includes(w));
  if (wd >= 0) {
    let diff = (wd - d.getDay() + 7) % 7;
    if (diff === 0 || next) diff += 7 * (next && diff !== 0 ? 0 : 1);
    d.setDate(d.getDate() + diff);
    return d.toISOString();
  }
  const dm = l.match(/(\d{1,2})\s(january|february|march|april|may|june|july|august|september|october|november|december)/);
  if (dm) {
    const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const r = new Date(d.getFullYear(), months.indexOf(dm[2]), Number(dm[1]), 17);
    if (r < from) r.setFullYear(r.getFullYear() + 1);
    return r.toISOString();
  }
  return undefined;
}

export function detectActions(body: string): ActionItem[] {
  const items: ActionItem[] = [];
  const re = /(?:please|kindly|could you|can you)\s+([^.\n?]+?)(?:\s+by\s+([A-Za-z0-9 ]+?)|\s+(within \d+ days?)|\s+(tomorrow))?(?:[.\n?]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const text = m[1].trim().replace(/^\w/, (c) => c.toUpperCase());
    const label = (m[2] || m[3] || m[4] || "").trim();
    items.push({
      id: uid(),
      text,
      deadlineLabel: label || undefined,
      deadline: label ? parseDeadline(label) : undefined,
      status: "Pending",
    });
  }
  return items.slice(0, 4);
}

export function summarize(subject: string, body: string) {
  const sentences = body.replace(/\s+/g, " ").split(/(?<=[.!?])\s/).filter(Boolean);
  const short = sentences[0] ? sentences[0].slice(0, 160) : subject;
  const detailed = sentences.slice(0, 3).join(" ") || subject;
  return { short, detailed };
}

export function analyzeNewEmail(partial: Pick<Email, "sender" | "senderEmail" | "subject" | "body">) {
  const c = classify(partial.subject, partial.body);
  const s = summarize(partial.subject, partial.body);
  return {
    ...c,
    summaryShort: s.short,
    summaryDetailed: s.detailed,
    extracted: extractInfo(partial.sender, partial.senderEmail, partial.subject, partial.body),
    actions: detectActions(partial.body),
  };
}

export function generateReply(email: Email, tone: Tone): string {
  const first = email.sender.split(" ")[0];
  const topic = email.category;
  const core: Record<string, string> = {
    "Customer Complaint": "I'm sorry about the trouble with your order. Could you confirm your order number so we can arrange a replacement or refund right away?",
    "Sales Inquiry": "Thanks for your interest. I've attached our pricing overview and can send a tailored quotation once I know your expected volume.",
    "Support Request": "We're looking into this now. Could you share a screenshot or the exact error message so our team can resolve it quickly?",
    "Meeting Request": "That works for us. I'm available on the proposed dates; please confirm a time that suits you and I'll send the invite.",
    "Invoice / Payment": "Thanks for flagging this. Our accounts team is reviewing the payment and will confirm the status within one business day.",
    "Job Application": "Thank you for applying. We've received your application and will get back to you within a week with next steps.",
    "Urgent": "I understand this is time-sensitive and I'm treating it as a priority. I'll update you shortly.",
  };
  const body = core[topic] ?? "Thank you for your message. I've noted the details and will follow up shortly.";
  const prior = email.thread.length > 0 ? " I've also reviewed our earlier conversation, so I won't repeat what we've already covered." : "";

  switch (tone) {
    case "Friendly":
      return `Hi ${first},\n\nThanks so much for reaching out! ${body}${prior}\n\nTalk soon,\nMailMind User`;
    case "Short":
      return `Hi ${first},\n\n${body.split(". ")[0].replace(/\.$/, "")}. I'll follow up soon.\n\nThanks`;
    case "Detailed":
      return `Dear ${first},\n\nThank you for your email regarding "${email.subject}". ${body}${prior}\n\nTo help us move faster, please reply with any supporting details (reference numbers, dates, attachments). Once we have them we'll confirm the next steps and expected timeline in writing.\n\nKind regards,\nMailMind User`;
    case "Apologetic":
      return `Dear ${first},\n\nWe sincerely apologize for the inconvenience. ${body}${prior}\n\nThank you for your patience, and again, our apologies.\n\nSincerely,\nMailMind User`;
    case "Formal":
      return `Dear Mr./Ms. ${email.sender.split(" ").slice(-1)[0]},\n\nWe acknowledge receipt of your correspondence dated ${new Date(email.date).toLocaleDateString()}. ${body}${prior}\n\nYours faithfully,\nMailMind User`;
    default:
      return `Hello ${first},\n\nThank you for contacting us. ${body}${prior}\n\nBest regards,\nMailMind User`;
  }
}

/* ---------- Natural-language search / assistant ---------- */

export interface SearchResult {
  ids: string[];
  explanation?: string;
}

/** Understands both keywords and a few natural-language intents. */
export function smartSearch(query: string, emails: Email[]): SearchResult {
  const q = query.toLowerCase().trim();
  if (!q) return { ids: emails.map((e) => e.id) };
  const live = emails.filter((e) => !e.deleted);

  const weekAgo = Date.now() - 7 * 86400000;
  let pool = live;
  let explanation: string | undefined;

  if (has(q, ["angry"])) { pool = live.filter((e) => e.sentiment === "Angry" || e.sentiment === "Negative"); explanation = "Sentiment is Angry or Negative"; }
  else if (has(q, ["reply", "response", "waiting"])) { pool = live.filter((e) => e.replyRequired && !e.replied); explanation = "Reply required and not yet answered"; }
  else if (has(q, ["urgent"])) { pool = live.filter((e) => e.priority === "High" || e.priority === "Critical"); explanation = "Priority is High or Critical"; }
  else if (has(q, ["complaint"])) { pool = live.filter((e) => e.category === "Customer Complaint"); explanation = "Category is Customer Complaint"; }
  else if (has(q, ["payment", "invoice"])) {
    pool = live.filter((e) => e.category === "Invoice / Payment" || /payment|invoice/i.test(e.subject + e.body));
    if (has(q, ["this week"])) pool = pool.filter((e) => new Date(e.date).getTime() > weekAgo);
    explanation = "Mentions payments or invoices";
  } else {
    const terms = q.split(/\s+/);
    pool = live.filter((e) => {
      const hay = `${e.sender} ${e.senderEmail} ${e.subject} ${e.body} ${e.category} ${e.priority} ${Object.values(e.extracted).join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  return { ids: pool.map((e) => e.id), explanation };
}

export function assistantAnswer(question: string, emails: Email[]): { text: string; ids: string[] } {
  const q = question.toLowerCase();
  const live = emails.filter((e) => !e.deleted && !e.archived);

  if (has(q, ["pending action", "today's pending", "what are"]) && has(q, ["action"])) {
    const items = live.flatMap((e) => e.actions.filter((a) => a.status === "Pending").map((a) => ({ e, a })));
    return {
      text: items.length
        ? `You have ${items.length} pending action${items.length > 1 ? "s" : ""}:\n` + items.slice(0, 6).map(({ e, a }) => `• ${a.text}${a.deadlineLabel ? ` (due ${a.deadlineLabel})` : ""} — from ${e.sender}`).join("\n")
        : "Nothing pending right now. Nice work!",
      ids: items.map(({ e }) => e.id),
    };
  }
  if (has(q, ["summarize", "summary", "important"])) {
    const top = live.filter((e) => e.priority === "High" || e.priority === "Critical").slice(0, 5);
    return {
      text: top.length ? "Here are today's most important emails:\n" + top.map((e) => `• ${e.sender}: ${e.summaryShort}`).join("\n") : "No high-priority emails right now.",
      ids: top.map((e) => e.id),
    };
  }
  const r = smartSearch(question, live);
  if (r.ids.length === 0) return { text: "I couldn't find any emails matching that. Try rephrasing, or ask about replies, complaints, payments or pending actions.", ids: [] };
  const matched = live.filter((e) => r.ids.includes(e.id)).slice(0, 6);
  return {
    text: `I found ${r.ids.length} email${r.ids.length > 1 ? "s" : ""}${r.explanation ? ` (${r.explanation.toLowerCase()})` : ""}:\n` + matched.map((e) => `• ${e.sender} — ${e.subject}`).join("\n"),
    ids: r.ids,
  };
}
