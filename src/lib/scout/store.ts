import { create } from "zustand";
import { computeDeal } from "./deal";
import { killCap, lintOrBlock } from "./gate";
import { computeKoi } from "./koi";
import { planFollow } from "./follow";
import { type AuditTrail } from "./compliance";
import { familyOf } from "./subjects";
import {
  blankSnapshot,
  clearSnapshot,
  readSnapshot,
  todayStamp,
  writeSnapshot,
  type Snapshot,
} from "./persist";
import type { Inbound, IntentClass, Lead, MailSend, Stage, VariantId } from "./types";

function withDeal(lead: Lead, patch: Partial<Lead> = {}): Lead {
  const next = { ...lead, ...patch };
  const { koi, band } = computeKoi(next.dims);
  const deal = computeDeal({ ...next, koi });
  return { ...next, koi, koiBand: band, deal, evEur: deal.evEur, lintOk: lintOrBlock(next).ok };
}

function unreadOf(inbound: Inbound[]) {
  return inbound.filter((m) => !m.read).length;
}

function applySnap(snap: Snapshot) {
  return {
    leads: snap.leads,
    inbound: snap.inbound,
    mailLog: snap.mailLog,
    trail: snap.trail,
    killSwitch: snap.killSwitch,
    sentToday: snap.sentToday,
    sentDate: snap.sentDate,
    dailyCap: snap.dailyCap,
    nightLog: snap.nightLog,
    unreadCount: unreadOf(snap.inbound),
    selectedId: null,
    nightRunning: false,
  };
}

type ScoutState = {
  leads: Lead[];
  inbound: Inbound[];
  selectedId: string | null;
  killSwitch: boolean;
  sentToday: number;
  sentDate: string;
  dailyCap: number;
  unreadCount: number;
  nightLog: string[];
  nightRunning: boolean;
  mailLog: MailSend[];
  trail: AuditTrail[];
  hydrated: boolean;
  hydrate: () => void;
  persistNow: () => void;
  select: (id: string | null) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  approve: (id: string) => { ok: boolean; error?: string };
  reject: (id: string, reason: string) => void;
  send: (id: string) => { ok: boolean; error?: string };
  setKill: (on: boolean) => void;
  markInboundRead: (id: string) => void;
  runNight: () => Promise<void>;
  reset: () => void;
  upsertLead: (lead: Lead) => void;
  pickSubject: (id: string, variant: VariantId) => void;
  sendFollow: (leadId: string) => { ok: boolean; error?: string };
  skipFollow: (leadId: string) => void;
  stopFollow: (leadId: string) => void;
};

const empty = blankSnapshot();

export const useScout = create<ScoutState>()((set, get) => ({
  ...applySnap(empty),
  hydrated: false,
  persistNow: () => {
    const s = get();
    writeSnapshot({
      leads: s.leads,
      inbound: s.inbound,
      mailLog: s.mailLog,
      trail: s.trail,
      killSwitch: s.killSwitch,
      sentToday: s.sentToday,
      sentDate: s.sentDate,
      dailyCap: s.dailyCap,
      nightLog: s.nightLog,
    });
  },
  hydrate: () => {
    if (get().hydrated) return;
    set({ ...applySnap(readSnapshot()), hydrated: true });
  },
  select: (id) => set({ selectedId: id }),
  updateLead: (id, patch) => {
    set({ leads: get().leads.map((l) => (l.id === id ? withDeal(l, patch) : l)) });
    get().persistNow();
  },
  approve: (id) => {
    const s = get();
    const gated = killCap(s.killSwitch, s.sentToday, s.dailyCap, false);
    if (!gated.ok) return gated;
    const lead = s.leads.find((l) => l.id === id);
    if (!lead) return { ok: false, error: "Túto firmu sa nepodarilo nájsť." };
    const lint = lintOrBlock(lead);
    if (!lint.ok) return { ok: false, error: lint.error };
    set({ leads: s.leads.map((l) => (l.id === id ? withDeal(l, { stage: "approved" }) : l)) });
    get().persistNow();
    return { ok: true };
  },
  reject: (id, reason) => {
    set({
      leads: get().leads.map((l) => (l.id === id ? { ...l, stage: "lost", unverified: [...l.unverified, reason] } : l)),
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
    get().persistNow();
  },
  send: (id) => {
    const s = get();
    const gated = killCap(s.killSwitch, s.sentToday, s.dailyCap, true);
    if (!gated.ok) return gated;
    const lead = s.leads.find((l) => l.id === id);
    if (!lead) return { ok: false, error: "Túto firmu sa nepodarilo nájsť." };
    if (lead.stage !== "approved") return { ok: false, error: "Najprv schváľ e-mail." };
    const lint = lintOrBlock(lead);
    if (!lint.ok) return { ok: false, error: lint.error };
    const sendRow: MailSend = {
      id: `m-${Date.now()}`,
      domain: lead.domain,
      leadId: lead.id,
      lang: lead.lang,
      koi: lead.koi,
      subject: lead.subject,
      family: familyOf(lead.subject),
      bodyWords: lead.body.trim().split(/\s+/).length,
      sentAt: Date.now(),
      opened: false,
      clicked: false,
      replied: false,
      meeting: false,
      won: false,
    };
    const day = todayStamp();
    set({
      sentToday: s.sentDate === day ? s.sentToday + 1 : 1,
      sentDate: day,
      mailLog: [sendRow, ...s.mailLog],
      trail: [
        {
          id: `t-${Date.now()}`,
          at: Date.now(),
          leadId: lead.id,
          domain: lead.domain,
          action: "send",
          who: "obchodník",
          viability: lead.ico ? `IČO ${lead.ico}` : "firma z webu",
          spam: lint.rep.spam,
          note: "Odoslané zo scout@.",
        },
        ...s.trail,
      ],
      leads: s.leads.map((l) => (l.id === id ? withDeal(l, { stage: "contacted", sentAt: Date.now(), sequenceStep: 1 }) : l)),
    });
    get().persistNow();
    return { ok: true };
  },
  setKill: (on) => {
    set({ killSwitch: on });
    get().persistNow();
  },
  markInboundRead: (id) => {
    const inbound = get().inbound.map((m) => (m.id === id ? { ...m, read: true } : m));
    set({ inbound, unreadCount: unreadOf(inbound) });
    get().persistNow();
  },
  runNight: async () => {
    if (get().nightRunning) return;
    set({
      nightRunning: true,
      nightLog: [
        "Kontrolujem, či smieme odosielať.",
        "Žiadny zoznam fiktívnych firiem.",
        "Novú firmu pridáš vo Webe — otvoríme ju naživo.",
      ],
    });
    await new Promise((r) => setTimeout(r, 400));
    set({
      nightRunning: false,
      nightLog: [...get().nightLog, `V prehľade je ${get().leads.length} firiem. Nič sa neodoslalo.`],
    });
    get().persistNow();
  },
  reset: () => {
    clearSnapshot();
    set({ ...applySnap(blankSnapshot()), hydrated: true });
  },
  upsertLead: (lead) => {
    const next = withDeal(lead);
    const exists = get().leads.some((l) => l.domain === next.domain);
    set({
      leads: exists ? get().leads.map((l) => (l.domain === next.domain ? next : l)) : [next, ...get().leads],
    });
    get().persistNow();
  },
  pickSubject: (id, variant) => {
    const lead = get().leads.find((l) => l.id === id);
    const opt = lead?.subjectOptions?.find((o) => o.id === variant);
    if (!lead || !opt) return;
    set({ leads: get().leads.map((l) => (l.id === id ? withDeal(l, { subject: opt.text, subjectPick: variant }) : l)) });
    get().persistNow();
  },
  sendFollow: (leadId) => {
    const s = get();
    const gated = killCap(s.killSwitch, s.sentToday, s.dailyCap, true);
    if (!gated.ok) return gated;
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) return { ok: false, error: "Túto firmu v prehľade nemáme." };
    const plan = planFollow(lead, s.mailLog, s.inbound);
    if (plan.kind === "none" || plan.channel === "stop") return { ok: false, error: plan.why };
    const lint = lintOrBlock({ ...lead, subject: plan.subject, body: plan.body });
    if (!lint.ok) return { ok: false, error: lint.error };
    const day = todayStamp();
    set({
      sentToday: s.sentDate === day ? s.sentToday + 1 : 1,
      sentDate: day,
      mailLog: [
        {
          id: `m-f-${Date.now()}`,
          domain: lead.domain,
          leadId: lead.id,
          lang: lead.lang,
          koi: lead.koi,
          subject: plan.subject,
          family: familyOf(plan.subject),
          bodyWords: plan.body.split(/\s+/).length,
          sentAt: Date.now(),
          opened: false,
          clicked: false,
          replied: false,
          meeting: false,
          won: false,
        },
        ...s.mailLog,
      ],
      leads: s.leads.map((l) =>
        l.id === leadId ? withDeal(l, { sentAt: Date.now(), sequenceStep: l.sequenceStep + 1 }) : l,
      ),
    });
    get().persistNow();
    return { ok: true };
  },
  skipFollow: (leadId) => {
    set({
      leads: get().leads.map((l) => (l.id === leadId ? withDeal(l, { followSnoozeUntil: Date.now() + 3 * 86_400_000 }) : l)),
    });
    get().persistNow();
  },
  stopFollow: (leadId) => {
    set({ leads: get().leads.map((l) => (l.id === leadId ? withDeal(l, { followStop: true, stage: "suppressed" }) : l)) });
    get().persistNow();
  },
}));

export type { IntentClass, Stage };
