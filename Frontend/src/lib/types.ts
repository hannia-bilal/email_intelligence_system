export type Category =
  | "Sales Inquiry"
  | "Customer Complaint"
  | "Support Request"
  | "Meeting Request"
  | "Invoice / Payment"
  | "Job Application"
  | "General Information"
  | "Spam"
  | "Urgent"
  | "Other";

export const CATEGORIES: Category[] = [
  "Sales Inquiry",
  "Customer Complaint",
  "Support Request",
  "Meeting Request",
  "Invoice / Payment",
  "Job Application",
  "General Information",
  "Spam",
  "Urgent",
  "Other",
];

export type Priority = "Low" | "Medium" | "High" | "Critical";
export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];

export type Sentiment = "Positive" | "Neutral" | "Negative" | "Angry" | "Urgent";
export const SENTIMENTS: Sentiment[] = ["Positive", "Neutral", "Negative", "Angry", "Urgent"];

export type Tone = "Professional" | "Friendly" | "Short" | "Detailed" | "Apologetic" | "Formal";
export const TONES: Tone[] = ["Professional", "Friendly", "Short", "Detailed", "Apologetic", "Formal"];

export type AiStatus = "Analyzed" | "Processing" | "Pending" | "Failed";

export interface ActionItem {
  id: string;
  text: string;
  deadlineLabel?: string; // as written in the email ("Friday")
  deadline?: string; // structured ISO date
  status: "Pending" | "Completed";
}

export interface ThreadMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string; // ISO
  body: string;
  isMe?: boolean;
}

export interface Email {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  receiver: string;
  subject: string;
  body: string;
  date: string; // ISO
  read: boolean;
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  replied: boolean;

  aiStatus: AiStatus;
  category: Category;
  intent: string;
  priority: Priority;
  priorityReason: string;
  sentiment: Sentiment;
  sentimentConfidence: number; // 0-100
  replyRequired: boolean;
  actionRequired: boolean;
  summaryShort: string;
  summaryDetailed: string;
  extracted: Record<string, string>;
  actions: ActionItem[];
  thread: ThreadMessage[]; // earlier messages in the conversation

  draft: string;
  draftTone: Tone;
}

export interface AppNotification {
  id: string;
  type:
    | "urgent"
    | "complaint"
    | "reply"
    | "deadline"
    | "action"
    | "ai";
  title: string;
  body: string;
  date: string;
  read: boolean;
  emailId?: string;
}

export interface AiLogEntry {
  id: string;
  date: string;
  text: string;
  kind: "summary" | "reply" | "classify" | "extract" | "assistant";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  emailIds?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
}

/** Full account record (what the admin console works with). Never contains the password. */
export interface AccountInfo extends User {
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  isDefault?: boolean;
}

export interface ResetRequest {
  id: string;
  email: string;
  date: string;
  done: boolean;
}

export interface AuditEntry {
  id: string;
  date: string;
  who: string;
  text: string;
}

export interface SiteSettings {
  allowSignups: boolean;
}

export interface NotificationPrefs {
  urgent: boolean;
  complaint: boolean;
  reply: boolean;
  deadline: boolean;
  action: boolean;
  ai: boolean;
}
