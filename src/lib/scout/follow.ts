import { ensureFooter } from "./compliance";
import type { Inbound, Lead, MailSend } from "./types";

export type FollowKind = "no_reply" | "open_no_click" | "click_no_reply" | "soft_no" | "hard_no" | "linkedin" | "none";

export type FollowPlan = {
  leadId: string;
  domain: string;
  kind: FollowKind;
  label: string;
  waitDays: number;
  dueAt: number;
  dueNow: boolean;
  subject: string;
  body: string;
  channel: "email" | "linkedin" | "stop";
  why: string;
};

export const KIND_LABEL: Record<FollowKind, string> = {
  no_reply: "Neotvorili",
  open_no_click: "Otvorili, neklikali",
  click_no_reply: "Klikli, neodpísali",
  soft_no: "Teraz nie",
  hard_no: "Stop — už nepísať",
  linkedin: "Skús LinkedIn",
  none: "Teraz nič",
};

const DAY = 86_400_000;

export function fmtWhen(ts: number) {
  const d = Math.round((ts - Date.now()) / DAY);
  if (d <= 0) return "teraz";
  if (d === 1) return "zajtra";
  return `o ${d} dní`;
}

export function planFollow(lead: Lead, mail: MailSend[], inbound: Inbound[], now = Date.now()): FollowPlan {
  const empty = (kind: FollowKind, why: string, channel: FollowPlan["channel"] = "stop"): FollowPlan => ({
    leadId: lead.id,
    domain: lead.domain,
    kind,
    label: KIND_LABEL[kind],
    waitDays: 0,
    dueAt: now,
    dueNow: false,
    subject: "",
    body: "",
    channel,
    why,
  });
  if (lead.followStop || lead.stage === "suppressed") return empty("hard_no", "Už nepíšeme.");
  if (["new", "review", "approved"].includes(lead.stage)) return empty("none", "Ešte neodišiel prvý e-mail.");
  if (lead.stage === "call" || lead.stage === "won" || lead.stage === "interest") return empty("none", "Firma už reagovala.");
  const last = mail.filter((m) => m.leadId === lead.id || m.domain === lead.domain).sort((a, b) => b.sentAt - a.sentAt)[0];
  const inn = inbound.filter((m) => m.leadId === lead.id).sort((a, b) => b.at - a.at)[0];
  if (inn?.intent === "reject_hard") return empty("hard_no", "Napísali stop.");
  let kind: FollowKind = "no_reply";
  let activity = lead.sentAt ?? now;
  let wait = 4;
  if (inn?.intent === "reject_soft" || lead.stage === "lost") {
    kind = "soft_no";
    wait = 14;
  } else if (last?.clicked && !last.replied) {
    kind = "click_no_reply";
    wait = 5;
    activity = last.clickedAt ?? last.sentAt;
  } else if (last?.opened && !last.replied) {
    kind = "open_no_click";
    wait = 7;
    activity = last.openedAt ?? last.sentAt;
  } else if (last && !last.opened) {
    kind = "no_reply";
    wait = lead.koi >= 80 ? 3 : 5;
    activity = last.sentAt;
  } else if (!lead.sentAt) return empty("none", "Nie je čo následovať.");
  const dueAt = Math.max(activity + wait * DAY, lead.followSnoozeUntil ?? 0);
  const fact = lead.claims.find((c) => c.allowed)?.text ?? lead.domain;
  const body = ensureFooter(
    lead.lang,
    `Dobrý deň,\n\nak predchádzajúci e-mail zapadol, stačí táto veta. Na ${lead.domain} sme videli: ${fact}\n\nStačí 15 minút.`,
  );
  return {
    leadId: lead.id,
    domain: lead.domain,
    kind,
    label: KIND_LABEL[kind],
    waitDays: wait,
    dueAt,
    dueNow: dueAt <= now,
    subject: `Ešte raz k ${lead.domain}`,
    body,
    channel: "email",
    why: `Ďalší e-mail o ${wait} dní, v hodinu poslednej aktivity.`,
  };
}

export function planAll(leads: Lead[], mail: MailSend[], inbound: Inbound[]) {
  const plans = leads.map((l) => planFollow(l, mail, inbound));
  return {
    due: plans.filter((p) => p.kind !== "none" && p.kind !== "hard_no" && p.dueNow),
    later: plans.filter((p) => p.kind !== "none" && p.kind !== "hard_no" && !p.dueNow),
    stopped: plans.filter((p) => p.kind === "hard_no"),
  };
}
