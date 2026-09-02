import type { AuditTrail } from "./compliance";
import type { Inbound, Lead, MailSend } from "./types";

export const STORAGE_KEY = "kestudio-scout-v1";

export type Snapshot = {
  v: 1;
  leads: Lead[];
  inbound: Inbound[];
  mailLog: MailSend[];
  trail: AuditTrail[];
  killSwitch: boolean;
  sentToday: number;
  sentDate: string;
  dailyCap: number;
  nightLog: string[];
};

export function todayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function blankSnapshot(): Snapshot {
  return {
    v: 1,
    leads: [],
    inbound: [],
    mailLog: [],
    trail: [],
    killSwitch: false,
    sentToday: 0,
    sentDate: todayStamp(),
    dailyCap: 35,
    nightLog: ["Ostrá prevádzka. Firmy pridáš kontrolou webu."],
  };
}

export function parseSnapshot(raw: string | null): Snapshot | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Snapshot>;
    if (data.v !== 1 || !Array.isArray(data.leads)) return null;
    const snap: Snapshot = {
      ...blankSnapshot(),
      leads: data.leads,
      inbound: Array.isArray(data.inbound) ? data.inbound : [],
      mailLog: Array.isArray(data.mailLog) ? data.mailLog : [],
      trail: Array.isArray(data.trail) ? data.trail : [],
      killSwitch: Boolean(data.killSwitch),
      sentToday: Number(data.sentToday) || 0,
      sentDate: typeof data.sentDate === "string" ? data.sentDate : todayStamp(),
      dailyCap: Number(data.dailyCap) || 35,
      nightLog: Array.isArray(data.nightLog) ? data.nightLog : blankSnapshot().nightLog,
    };
    if (snap.sentDate !== todayStamp()) {
      snap.sentToday = 0;
      snap.sentDate = todayStamp();
    }
    return snap;
  } catch {
    return null;
  }
}

export function readSnapshot(): Snapshot {
  if (typeof localStorage === "undefined") return blankSnapshot();
  return parseSnapshot(localStorage.getItem(STORAGE_KEY)) ?? blankSnapshot();
}

export function writeSnapshot(snap: Omit<Snapshot, "v">) {
  if (typeof localStorage === "undefined") return;
  const payload: Snapshot = { v: 1, ...snap };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearSnapshot() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
