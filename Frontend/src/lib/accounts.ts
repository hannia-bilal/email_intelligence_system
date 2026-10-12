import type { AccountInfo, AuditEntry, ResetRequest, SiteSettings, User } from "./types";
import { hashPassword, makeSalt } from "./hash";
import { readJson, writeJson } from "./storage";
import { uid } from "./utils";

/**
 * Local account store (browser only). It stands in for a real backend so the whole flow –
 * register, sign in, admin console – can be used without a server. Replace with API calls later.
 */
export interface Account extends AccountInfo {
  salt: string;
  hash: string;
}

export const DEFAULT_ADMIN_EMAIL = "demo@mailmind.ai";

// Pre-computed salted hash – the default admin password is not stored in plain text anywhere in the source.
const DEFAULT_ADMIN: Account = {
  id: "admin-default",
  name: "Administrator",
  email: DEFAULT_ADMIN_EMAIL,
  role: "admin",
  active: true,
  isDefault: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  salt: "mm-root-7f3a91",
  hash: "bb9546373eb3e447f86e546ae5355b1880748855f43495af9b49ba04a9b55b4b",
};

const K = { users: "mm_accounts", session: "mm_session_id", requests: "mm_reset_requests", audit: "mm_audit", settings: "mm_site_settings" };

export const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function loadAccounts(): Account[] {
  const list = readJson<Account[]>(K.users, []);
  const rest = list.filter((a) => a.id !== DEFAULT_ADMIN.id);
  const stored = list.find((a) => a.id === DEFAULT_ADMIN.id);
  // keep any password the default admin has set since, but never let the role/flags drift
  const root: Account = stored ? { ...DEFAULT_ADMIN, salt: stored.salt, hash: stored.hash, name: stored.name, lastLogin: stored.lastLogin } : DEFAULT_ADMIN;
  return [root, ...rest];
}
export const saveAccounts = (list: Account[]) => writeJson(K.users, list);

export const toUser = (a: Account): User => ({ id: a.id, name: a.name, email: a.email, phone: a.phone, role: a.role });
export const toInfo = ({ salt: _s, hash: _h, ...rest }: Account): AccountInfo => rest;

export const checkPassword = (a: Account, password: string) => hashPassword(password, a.salt) === a.hash;

export function newAccount(p: { name: string; email: string; phone?: string; password: string; role: "user" | "admin" }): Account {
  const salt = makeSalt();
  return {
    id: uid() + uid(),
    name: p.name.trim(),
    email: p.email.trim(),
    phone: p.phone?.trim() || undefined,
    role: p.role,
    active: true,
    createdAt: new Date().toISOString(),
    salt,
    hash: hashPassword(p.password, salt),
  };
}

export function withPassword(a: Account, password: string): Account {
  const salt = makeSalt();
  return { ...a, salt, hash: hashPassword(password, salt) };
}

/* session */
export const loadSessionId = () => readJson<string | null>(K.session, null);
export const saveSessionId = (id: string | null) => writeJson(K.session, id);

/* reset requests */
export const loadRequests = () => readJson<ResetRequest[]>(K.requests, []);
export const saveRequests = (r: ResetRequest[]) => writeJson(K.requests, r);

/* audit */
export const loadAudit = () => readJson<AuditEntry[]>(K.audit, []);
export const saveAudit = (a: AuditEntry[]) => writeJson(K.audit, a.slice(0, 200));

/* settings */
export const loadSettings = () => readJson<SiteSettings>(K.settings, { allowSignups: true });
export const saveSettings = (s: SiteSettings) => writeJson(K.settings, s);

/** Memorable temporary password for admin-assisted resets (no look-alike characters). */
export function tempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXY346789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
