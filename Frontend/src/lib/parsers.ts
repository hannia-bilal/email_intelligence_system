import type { Email } from "./types";

type Draft = Partial<Email>;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

function splitAddress(raw: string) {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || m[2].split("@")[0], email: m[2].trim() };
  const email = raw.trim();
  return { name: email.split("@")[0] || "Unknown", email };
}

/** Minimal RFC 822 parser (headers + body). Handles folded header lines. */
export function parseRfc822(raw: string): Draft {
  const text = raw.replace(/\r\n/g, "\n");
  const idx = text.indexOf("\n\n");
  const head = idx === -1 ? text : text.slice(0, idx);
  const body = idx === -1 ? "" : text.slice(idx + 2).trim();
  const headers: Record<string, string> = {};
  let last = "";
  for (const line of head.split("\n")) {
    if (/^\s/.test(line) && last) {
      headers[last] += " " + line.trim();
      continue;
    }
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (m) {
      last = m[1].toLowerCase();
      headers[last] = m[2];
    }
  }
  if (!headers["from"] && !headers["subject"]) throw new Error("Could not find From/Subject headers – is this a valid RFC 822 message?");
  const from = splitAddress(headers["from"] ?? "unknown@example.com");
  const date = headers["date"] && !isNaN(Date.parse(headers["date"])) ? new Date(headers["date"]).toISOString() : new Date().toISOString();
  return {
    sender: from.name,
    senderEmail: from.email,
    receiver: headers["to"] ?? "you@mailmind.ai",
    subject: headers["subject"] ?? "(no subject)",
    date,
    body,
  };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const pick = (o: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) {
    const hit = Object.keys(o).find((x) => x.toLowerCase().replace(/[\s_-]/g, "") === k);
    if (hit && o[hit] != null && String(o[hit]).trim() !== "") return String(o[hit]);
  }
  return undefined;
};

function fromRecord(o: Record<string, unknown>): Draft {
  const fromRaw = pick(o, ["from", "sender"]);
  const parsed = fromRaw ? splitAddress(fromRaw) : undefined;
  const senderEmail = pick(o, ["senderemail", "fromemail"]) ?? parsed?.email;
  const sender = pick(o, ["sendername", "fromname"]) ?? (parsed && parsed.name !== parsed.email ? parsed.name : undefined) ?? senderEmail?.split("@")[0];
  const d = pick(o, ["date", "datetime", "received", "timestamp"]);
  return {
    sender: sender ?? "Unknown",
    senderEmail: senderEmail ?? "unknown@example.com",
    receiver: pick(o, ["to", "receiver", "recipient"]) ?? "you@mailmind.ai",
    subject: pick(o, ["subject", "title"]) ?? "(no subject)",
    body: pick(o, ["body", "message", "content", "text"]) ?? "",
    date: d && !isNaN(Date.parse(d)) ? new Date(d).toISOString() : new Date().toISOString(),
  };
}

export function parseCsv(text: string): Draft[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row.");
  const head = rows[0];
  return rows.slice(1).map((r) => fromRecord(Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""]))));
}

export function parseJson(text: string): Draft[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }
  const arr = Array.isArray(data) ? data : Array.isArray((data as { emails?: unknown })?.emails) ? (data as { emails: unknown[] }).emails : null;
  if (!arr) throw new Error("JSON must be an array of emails (or an object with an \"emails\" array).");
  return arr.map((o) => fromRecord(o as Record<string, unknown>));
}

export async function parseFile(file: File): Promise<Draft[]> {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 5 MB.`);
  const ext = file.name.split(".").pop()?.toLowerCase();
  const text = await file.text();
  if (ext === "json") return parseJson(text);
  if (ext === "csv") return parseCsv(text);
  if (ext === "eml") return [parseRfc822(text)];
  throw new Error(`${file.name}: only .eml, .csv and .json files are supported.`);
}
