import { create } from "zustand";
import type {
  AccountInfo,
  AiLogEntry,
  AppNotification,
  AuditEntry,
  ChatMessage,
  Email,
  NotificationPrefs,
  ResetRequest,
  SiteSettings,
  Tone,
  User,
} from "../lib/types";
import { seedAiLogs, seedEmails, seedNotifications } from "../data/seed";
import { analyzeNewEmail, assistantAnswer, generateReply } from "../lib/mockAi";
import { uid } from "../lib/utils";
import { readJson, removeKey, writeJson } from "../lib/storage";
import {
  checkPassword,
  loadAccounts,
  loadAudit,
  loadRequests,
  loadSessionId,
  loadSettings,
  newAccount,
  saveAccounts,
  saveAudit,
  saveRequests,
  saveSessionId,
  saveSettings,
  sameEmail,
  tempPassword,
  toInfo,
  toUser,
  withPassword,
  type Account,
} from "../lib/accounts";

/** New accounts get their own private copy of the sample mailbox. Set to false to start them empty. */
const SEED_NEW_ACCOUNTS = true;

const DEFAULT_PREFS: NotificationPrefs = { urgent: true, complaint: true, reply: true, deadline: true, action: true, ai: false };

interface Mailbox {
  emails: Email[];
  notifications: AppNotification[];
  aiLogs: AiLogEntry[];
  prefs: NotificationPrefs;
}

const mailKey = (id: string) => `mm_mail_${id}`;

function loadMailbox(user: User): Mailbox {
  const saved = readJson<Mailbox | null>(mailKey(user.id), null);
  if (saved) return { ...saved, prefs: { ...DEFAULT_PREFS, ...saved.prefs } };
  if (!SEED_NEW_ACCOUNTS || user.role === "admin") return { emails: [], notifications: [], aiLogs: [], prefs: DEFAULT_PREFS };
  // personalise the sample data with this user's own address
  const swap = <T,>(v: T): T => JSON.parse(JSON.stringify(v).split("you@mailmind.ai").join(user.email));
  return { emails: swap(seedEmails), notifications: swap(seedNotifications), aiLogs: swap(seedAiLogs), prefs: DEFAULT_PREFS };
}

const WELCOME: ChatMessage = {
  id: "c0",
  role: "assistant",
  text: "Hi! Ask me about replies you owe, complaints, payments or pending actions — I look through your actual inbox.",
};

const EMPTY_MAIL: Mailbox = { emails: [], notifications: [], aiLogs: [], prefs: DEFAULT_PREFS };

export interface Toast {
  id: string;
  text: string;
  tone: "success" | "error" | "info";
}

type Result = { ok: boolean; error?: string };

interface State {
  user: User | null;
  accounts: AccountInfo[];
  requests: ResetRequest[];
  audit: AuditEntry[];
  settings: SiteSettings;

  emails: Email[];
  notifications: AppNotification[];
  aiLogs: AiLogEntry[];
  chat: ChatMessage[];
  prefs: NotificationPrefs;
  generating: Record<string, boolean>;
  globalQuery: string;
  toasts: Toast[];

  // auth
  login: (email: string, password: string) => Result & { role?: "user" | "admin" };
  signup: (p: { name: string; phone?: string; email: string; password: string }) => Result;
  logout: () => void;
  requestReset: (email: string) => void;
  updateProfile: (p: { name: string; email: string; phone?: string }) => Result;
  changePassword: (current: string, next: string) => Result;
  setPrefs: (p: Partial<NotificationPrefs>) => void;

  // admin
  addAdmin: (p: { name: string; email: string; password: string }) => Result;
  setActive: (id: string, active: boolean) => Result;
  setRole: (id: string, role: "user" | "admin") => Result;
  deleteAccount: (id: string) => Result;
  resetPasswordFor: (id: string) => string | null;
  dismissRequest: (id: string) => void;
  setSettings: (p: Partial<SiteSettings>) => void;

  // emails
  setGlobalQuery: (q: string) => void;
  toggleRead: (id: string, value?: boolean) => void;
  toggleStar: (id: string) => void;
  archive: (id: string) => void;
  remove: (id: string) => void;
  setDraft: (id: string, draft: string) => void;
  setTone: (id: string, tone: Tone) => void;
  generateDraft: (id: string, tone?: Tone) => void;
  rejectDraft: (id: string) => void;
  approveDraft: (id: string) => void;
  toggleAction: (emailId: string, actionId: string) => void;
  importEmails: (list: Partial<Email>[]) => number;
  createEmail: (e: { sender: string; senderEmail: string; receiver: string; subject: string; body: string; date: string }) => string;

  // notifications / chat
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  ask: (q: string) => void;
  clearChat: () => void;

  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
}

/* ---- boot: restore the signed-in account (if it still exists and is active) ---- */
let ACCOUNTS: Account[] = loadAccounts();
const bootAccount = ACCOUNTS.find((a) => a.id === loadSessionId() && a.active);
const bootUser = bootAccount ? toUser(bootAccount) : null;
const bootMail = bootUser ? loadMailbox(bootUser) : EMPTY_MAIL;

const FAILS = readJson<{ count: number; lockedUntil: number }>("mm_lock", { count: 0, lockedUntil: 0 });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const useStore = create<State>((set, get) => {
  const commitAccounts = (list: Account[]) => {
    ACCOUNTS = list;
    saveAccounts(list);
    set({ accounts: list.map(toInfo) });
  };
  const log = (text: string) => {
    const who = get().user?.email ?? "system";
    const audit = [{ id: uid(), date: new Date().toISOString(), who, text }, ...get().audit];
    saveAudit(audit);
    set({ audit: audit.slice(0, 200) });
  };
  const needAdmin = (): Result | null => (get().user?.role === "admin" ? null : { ok: false, error: "Not allowed." });
  const enter = (a: Account) => {
    const u = toUser(a);
    const m = loadMailbox(u);
    saveSessionId(a.id);
    set({ user: u, emails: m.emails, notifications: m.notifications, aiLogs: m.aiLogs, prefs: m.prefs, chat: [WELCOME], globalQuery: "" });
  };

  return {
  user: bootUser,
  accounts: ACCOUNTS.map(toInfo),
  requests: loadRequests(),
  audit: loadAudit(),
  settings: loadSettings(),

  emails: bootMail.emails,
  notifications: bootMail.notifications,
  aiLogs: bootMail.aiLogs,
  chat: [WELCOME],
  prefs: bootMail.prefs,
  generating: {},
  globalQuery: "",
  toasts: [],

  /* ---------------------------- auth ---------------------------- */
  login: (email, password) => {
    const now = Date.now();
    if (FAILS.lockedUntil > now) return { ok: false, error: "Too many attempts. Please wait a minute and try again." };
    const a = ACCOUNTS.find((x) => sameEmail(x.email, email));
    if (!a || !checkPassword(a, password)) {
      FAILS.count += 1;
      if (FAILS.count >= 5) {
        FAILS.count = 0;
        FAILS.lockedUntil = now + 60_000;
      }
      writeJson("mm_lock", FAILS);
      return { ok: false, error: "Incorrect email or password." };
    }
    FAILS.count = 0;
    writeJson("mm_lock", FAILS);
    if (!a.active) return { ok: false, error: "This account can't sign in right now. Please contact your administrator." };
    const updated = ACCOUNTS.map((x) => (x.id === a.id ? { ...x, lastLogin: new Date().toISOString() } : x));
    commitAccounts(updated);
    enter(updated.find((x) => x.id === a.id)!);
    if (a.role === "admin") log("Signed in");
    return { ok: true, role: a.role };
  },
  signup: ({ name, phone, email, password }) => {
    if (!get().settings.allowSignups) return { ok: false, error: "Sign-ups are closed at the moment." };
    if (ACCOUNTS.some((x) => sameEmail(x.email, email))) return { ok: false, error: "An account with this email already exists." };
    const acc = newAccount({ name, phone, email, password, role: "user" });
    const withLogin = { ...acc, lastLogin: new Date().toISOString() };
    commitAccounts([...ACCOUNTS, withLogin]);
    enter(withLogin);
    return { ok: true };
  },
  logout: () => {
    saveSessionId(null);
    set({ user: null, emails: [], notifications: [], aiLogs: [], chat: [WELCOME], globalQuery: "" });
  },
  requestReset: (email) => {
    // Always behaves the same from the outside; only a real account creates a request for the admins.
    const a = ACCOUNTS.find((x) => sameEmail(x.email, email));
    if (!a || a.role === "admin") return;
    const open = get().requests.filter((r) => !(sameEmail(r.email, a.email) && !r.done));
    const requests = [{ id: uid(), email: a.email, date: new Date().toISOString(), done: false }, ...open];
    saveRequests(requests);
    set({ requests });
  },
  updateProfile: ({ name, email, phone }) => {
    const cur = get().user;
    if (!cur) return { ok: false, error: "Not signed in." };
    if (ACCOUNTS.some((x) => x.id !== cur.id && sameEmail(x.email, email))) return { ok: false, error: "That email is already used by another account." };
    const list = ACCOUNTS.map((x) => (x.id === cur.id ? { ...x, name, email: email.trim(), phone: phone?.trim() || undefined } : x));
    commitAccounts(list);
    set({ user: toUser(list.find((x) => x.id === cur.id)!) });
    return { ok: true };
  },
  changePassword: (current, next) => {
    const cur = get().user;
    const me = ACCOUNTS.find((a) => a.id === cur?.id);
    if (!me) return { ok: false, error: "Not signed in." };
    if (!checkPassword(me, current)) return { ok: false, error: "Current password is incorrect." };
    commitAccounts(ACCOUNTS.map((a) => (a.id === me.id ? withPassword(a, next) : a)));
    if (me.role === "admin") log("Changed own password");
    return { ok: true };
  },
  setPrefs: (p) => set({ prefs: { ...get().prefs, ...p } }),

  /* ---------------------------- admin ---------------------------- */
  addAdmin: ({ name, email, password }) => {
    const denied = needAdmin();
    if (denied) return denied;
    if (name.trim().length < 2) return { ok: false, error: "Enter the admin's full name." };
    if (!validEmail(email)) return { ok: false, error: "Enter a valid email address." };
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    if (ACCOUNTS.some((x) => sameEmail(x.email, email))) return { ok: false, error: "An account with this email already exists." };
    commitAccounts([...ACCOUNTS, newAccount({ name, email, password, role: "admin" })]);
    log(`Added admin ${email.trim()}`);
    return { ok: true };
  },
  setActive: (id, active) => {
    const denied = needAdmin();
    if (denied) return denied;
    const t = ACCOUNTS.find((a) => a.id === id);
    if (!t) return { ok: false, error: "Account not found." };
    if (t.isDefault || t.id === get().user?.id) return { ok: false, error: "This account can't be disabled." };
    commitAccounts(ACCOUNTS.map((a) => (a.id === id ? { ...a, active } : a)));
    log(`${active ? "Enabled" : "Disabled"} ${t.email}`);
    return { ok: true };
  },
  setRole: (id, role) => {
    const denied = needAdmin();
    if (denied) return denied;
    const t = ACCOUNTS.find((a) => a.id === id);
    if (!t) return { ok: false, error: "Account not found." };
    if (t.isDefault || t.id === get().user?.id) return { ok: false, error: "This account's role can't be changed." };
    commitAccounts(ACCOUNTS.map((a) => (a.id === id ? { ...a, role } : a)));
    log(role === "admin" ? `Made ${t.email} an admin` : `Removed admin rights from ${t.email}`);
    return { ok: true };
  },
  deleteAccount: (id) => {
    const denied = needAdmin();
    if (denied) return denied;
    const t = ACCOUNTS.find((a) => a.id === id);
    if (!t) return { ok: false, error: "Account not found." };
    if (t.isDefault || t.id === get().user?.id) return { ok: false, error: "This account can't be deleted." };
    commitAccounts(ACCOUNTS.filter((a) => a.id !== id));
    removeKey(mailKey(id));
    const requests = get().requests.filter((r) => !sameEmail(r.email, t.email));
    saveRequests(requests);
    set({ requests });
    log(`Deleted ${t.email}`);
    return { ok: true };
  },
  resetPasswordFor: (id) => {
    if (needAdmin()) return null;
    const t = ACCOUNTS.find((a) => a.id === id);
    if (!t || t.isDefault) return null;
    const pw = tempPassword();
    commitAccounts(ACCOUNTS.map((a) => (a.id === id ? withPassword(a, pw) : a)));
    const requests = get().requests.map((r) => (sameEmail(r.email, t.email) ? { ...r, done: true } : r));
    saveRequests(requests);
    set({ requests });
    log(`Reset password for ${t.email}`);
    return pw;
  },
  dismissRequest: (id) => {
    if (needAdmin()) return;
    const requests = get().requests.filter((r) => r.id !== id);
    saveRequests(requests);
    set({ requests });
  },
  setSettings: (p) => {
    if (needAdmin()) return;
    const settings = { ...get().settings, ...p };
    saveSettings(settings);
    set({ settings });
    log(settings.allowSignups ? "Opened new sign-ups" : "Closed new sign-ups");
  },

  /* ---------------------------- emails ---------------------------- */
  setGlobalQuery: (q) => set({ globalQuery: q }),
  toggleRead: (id, value) =>
    set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, read: value ?? !e.read } : e)) })),
  toggleStar: (id) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)) })),
  archive: (id) => {
    set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, archived: !e.archived } : e)) }));
  },
  remove: (id) => {
    set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, deleted: true } : e)) }));
    get().toast("Email moved to trash", "info");
  },
  setDraft: (id, draft) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, draft } : e)) })),
  setTone: (id, tone) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, draftTone: tone } : e)) })),
  generateDraft: (id, tone) => {
    const email = get().emails.find((e) => e.id === id);
    if (!email) return;
    const t = tone ?? email.draftTone;
    set((s) => ({
      generating: { ...s.generating, [id]: true },
      emails: s.emails.map((e) => (e.id === id ? { ...e, draftTone: t } : e)),
    }));
    // simulate network / LLM latency
    setTimeout(() => {
      const draft = generateReply(email, t);
      set((s) => ({
        generating: { ...s.generating, [id]: false },
        emails: s.emails.map((e) => (e.id === id ? { ...e, draft, draftTone: t } : e)),
        aiLogs: [
          { id: uid(), date: new Date().toISOString(), text: `Drafted ${t.toLowerCase()} reply to ${email.sender}`, kind: "reply" },
          ...s.aiLogs,
        ],
      }));
    }, 900);
  },
  rejectDraft: (id) => {
    set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, draft: "" } : e)) }));
    get().toast("Draft discarded", "info");
  },
  approveDraft: (id) => {
    const email = get().emails.find((e) => e.id === id);
    if (!email || !email.draft.trim()) return;
    // The frontend never sends mail itself – a real backend call would go here after approval.
    set((s) => ({
      emails: s.emails.map((e) =>
        e.id === id
          ? {
              ...e,
              replied: true,
              draft: "",
              thread: [
                ...e.thread,
                { id: uid(), from: e.sender, fromEmail: e.senderEmail, to: e.senderEmail, date: e.date, body: e.body },
                { id: uid(), from: "You", fromEmail: e.receiver, to: e.senderEmail, date: new Date().toISOString(), body: e.draft, isMe: true },
              ],
            }
          : e,
      ),
    }));
    get().toast("Reply approved and sent", "success");
  },
  toggleAction: (emailId, actionId) =>
    set((s) => ({
      emails: s.emails.map((e) =>
        e.id === emailId
          ? {
              ...e,
              actions: e.actions.map((a) =>
                a.id === actionId ? { ...a, status: a.status === "Pending" ? "Completed" : "Pending" } : a,
              ),
            }
          : e,
      ),
    })),

  importEmails: (list) => {
    const created: Email[] = list.map((p) => {
      const base = {
        sender: p.sender ?? "Unknown",
        senderEmail: p.senderEmail ?? "unknown@example.com",
        subject: p.subject ?? "(no subject)",
        body: p.body ?? "",
      };
      const ai = analyzeNewEmail(base);
      return {
        id: uid(),
        threadId: uid(),
        receiver: p.receiver ?? "you@mailmind.ai",
        date: p.date ?? new Date().toISOString(),
        read: false,
        starred: false,
        archived: false,
        deleted: false,
        replied: false,
        aiStatus: "Analyzed",
        thread: [],
        draft: "",
        draftTone: "Professional",
        ...base,
        ...ai,
      } as Email;
    });
    set((s) => ({
      emails: [...created, ...s.emails],
      aiLogs: [
        { id: uid(), date: new Date().toISOString(), text: `Imported ${created.length} email(s)`, kind: "classify" },
        ...s.aiLogs,
      ],
      notifications: get().prefs.ai
        ? [
            { id: uid(), type: "ai", title: "Import finished", body: `${created.length} email(s) sorted`, date: new Date().toISOString(), read: false },
            ...s.notifications,
          ]
        : s.notifications,
    }));
    return created.length;
  },
  createEmail: (e) => {
    const [created] = [e].map((p) => p);
    const before = get().emails.length;
    get().importEmails([created]);
    return get().emails[0]?.id ?? String(before);
  },

  /* ---------------------------- notifications / chat ---------------------------- */
  markNotificationRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  ask: (q) => {
    const text = q.trim();
    if (!text) return;
    set((s) => ({ chat: [...s.chat, { id: uid(), role: "user", text }] }));
    setTimeout(() => {
      const a = assistantAnswer(text, get().emails);
      set((s) => ({
        chat: [...s.chat, { id: uid(), role: "assistant", text: a.text, emailIds: a.ids.slice(0, 5) }],
        aiLogs: [{ id: uid(), date: new Date().toISOString(), text: `Answered: "${text.slice(0, 40)}"`, kind: "assistant" }, ...s.aiLogs],
      }));
    }, 700);
  },
  clearChat: () => set({ chat: [get().chat[0]] }),

  toast: (text, tone = "success") => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  };
});

/* ---- persist each person's mailbox separately ---- */
useStore.subscribe((s, prev) => {
  if (!s.user) return;
  if (s.emails !== prev.emails || s.notifications !== prev.notifications || s.aiLogs !== prev.aiLogs || s.prefs !== prev.prefs) {
    writeJson(mailKey(s.user.id), { emails: s.emails, notifications: s.notifications, aiLogs: s.aiLogs, prefs: s.prefs });
  }
});
