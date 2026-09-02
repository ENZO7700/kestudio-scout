import { FAMILY_LABELS, STAGES, type KoiBand, type Lang, type Lead, type MailSend, type SubjectFamily } from "./types";
import { FAMILY_ORDER } from "./subjects";

function pct(n: number, d: number) {
  return d ? Math.round((100 * n) / d) : 0;
}

export function fmtPct(n: number) {
  return `${n} %`;
}

export function computeStats(leads: Lead[], mail: MailSend[]) {
  const sent = mail.length;
  const openPct = pct(mail.filter((m) => m.opened).length, sent);
  const clickPct = pct(mail.filter((m) => m.clicked).length, sent);
  const replyPct = pct(mail.filter((m) => m.replied).length, sent);
  const won = mail.filter((m) => m.won).length;
  const opened = mail.filter((m) => m.opened);
  const replied = mail.filter((m) => m.replied);
  const meetings = mail.filter((m) => m.meeting);
  const funnel = STAGES.map((s) => ({ id: s.id, label: s.label, count: leads.filter((l) => l.stage === s.id).length }));
  const families = FAMILY_ORDER.map((family) => {
    const rows = mail.filter((m) => m.family === family);
    const n = rows.length;
    return { family, label: FAMILY_LABELS[family], sent: n, open: pct(rows.filter((m) => m.opened).length, n), reply: pct(rows.filter((m) => m.replied).length, n) };
  });
  const winner = [...families].sort((a, b) => b.reply - a.reply || b.open - a.open)[0];
  const koiRows = [
    { band: "apex" as KoiBand, label: "Top šanca 80+", test: (k: number) => k >= 80 },
    { band: "strong" as KoiBand, label: "Dobrá 60–79", test: (k: number) => k >= 60 && k < 80 },
    { band: "watch" as KoiBand, label: "Slabá pod 60", test: (k: number) => k < 60 },
  ].map((r) => {
    const rows = mail.filter((m) => r.test(m.koi));
    const n = rows.length;
    return { ...r, sent: n, reply: pct(rows.filter((m) => m.replied).length, n), won: pct(rows.filter((m) => m.won).length, n) };
  });
  const langs: Lang[] = ["sk", "cs", "de", "pl", "hu"];
  const byLang = langs.map((lang) => {
    const rows = mail.filter((m) => m.lang === lang);
    const n = rows.length;
    return { lang, sent: n, open: pct(rows.filter((m) => m.opened).length, n), reply: pct(rows.filter((m) => m.replied).length, n) };
  });
  const silentLeads = leads.filter((l) => l.stage === "contacted" && l.sentAt && Date.now() - l.sentAt > 7 * 86_400_000);
  const waiting = leads.filter((l) => l.stage === "contacted" && l.sentAt && Date.now() - l.sentAt <= 7 * 86_400_000);
  return {
    sent,
    openPct,
    clickPct,
    replyPct,
    won,
    replyFromOpen: pct(replied.length, opened.length),
    meetPct: pct(meetings.length, replied.length || 1),
    winPct: pct(won, meetings.length || 1),
    funnel,
    families,
    winner,
    winnerFamily: winner?.family ?? ("fakt" as SubjectFamily),
    koiRows,
    byLang,
    silentLeads,
    waiting,
  };
}
