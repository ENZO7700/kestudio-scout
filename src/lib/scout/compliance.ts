import type { Claim, Country, Lang, Lead } from "./types";

export type ComplianceCheck = {
  id: string;
  label: string;
  pass: boolean;
  block: boolean;
  text: string;
};

export type ComplianceReport = {
  ok: boolean;
  spam: number;
  checks: ComplianceCheck[];
  playbook: Country;
};

export type AuditTrail = {
  id: string;
  at: number;
  leadId: string;
  domain: string;
  action: "approve" | "send" | "block" | "archive";
  who: string;
  viability: string;
  spam: number;
  note: string;
};

export const RETAIN_MS = Math.round(18 * 30.44 * 86_400_000);

const THREAT = /pokut|pokuta|fine you|we will sue|abmahnung/i;

export function spamScore(subject: string, body: string) {
  const text = `${subject}\n${body}`;
  let n = 0;
  if (/!{3,}/.test(text)) n += 3;
  if (/\burgent\b|\bokamžite\b/i.test(text)) n += 3;
  if (/100\s*%|guarantee/i.test(text)) n += 2;
  if (subject === subject.toUpperCase() && subject.length > 8) n += 2;
  return { n: Math.min(10, n), why: [] as string[] };
}

function hasOptOut(body: string) {
  return /\bstop\b|opt-?out|odhlás|widerspruch|rezygnac|unsubscribe/i.test(body);
}
function hasBasis(country: Country, body: string) {
  if (country === "DE" || country === "AT") return /art\.?\s*6|dsgvo|widerspruch/i.test(body);
  return /oprávnen|oprávněn|záujem|zajem|legitimate interest|jogos|uzasadnion/i.test(body) || hasOptOut(body);
}
function hasIdentity(body: string) {
  return /kestudio\.sk|scout@kestudio/i.test(body);
}

export function checkCompliance(lead: {
  country: Country;
  lang: Lang;
  subject: string;
  body: string;
  claims: Claim[];
  viability: Lead["viability"];
}): ComplianceReport {
  const spam = spamScore(lead.subject, lead.body);
  const threat = THREAT.test(`${lead.subject}\n${lead.body}`);
  const opt = hasOptOut(lead.body);
  const basis = hasBasis(lead.country, lead.body);
  const idn = hasIdentity(lead.body);
  const fact = lead.claims.some((c) => c.allowed);
  const checks: ComplianceCheck[] = [
    { id: "optout", label: "Stop v texte", pass: opt, block: true, text: opt ? "Je tam stop." : "Chýba veta, že stačí odpísať stop." },
    { id: "basis", label: "Prečo smieme písať", pass: basis, block: true, text: basis ? "Právny dôvod je v texte." : "Doplň oprávnený záujem." },
    { id: "identity", label: "Kto píše", pass: idn, block: true, text: idn ? "Je tam keSTUDIO." : "Chýba scout@kestudio.sk." },
    { id: "threat", label: "Bez vyhrážok", pass: !threat, block: true, text: threat ? "V texte je pokuta." : "Bez pokút." },
    { id: "spam", label: "Nie spam", pass: spam.n < 6, block: spam.n >= 6, text: spam.n === 0 ? "Čistý text." : `Stop-skóre ${spam.n}/10` },
    { id: "fact", label: "Dôkaz z webu", pass: fact, block: true, text: fact ? "Je tam merateľný nález." : "Bez dôkazu e-mail nejde." },
    { id: "viability", label: "Reálna firma", pass: lead.viability === "pass", block: true, text: lead.viability === "pass" ? "Firma prešla." : "Túto schránku neoslovujeme." },
  ];
  return { ok: checks.filter((c) => c.block).every((c) => c.pass), spam: spam.n, checks, playbook: lead.country };
}

export const FOOTER: Record<Lang, string> = {
  sk: "Píšeme z oprávneného záujmu (B2B). Údaje držíme 18 mesiacov. Ak o podobné upozornenia nemáte záujem, odpíšte „stop“ — vyradíme vás do 24 h.\nTím keSTUDIO · kestudio.sk · scout@kestudio.sk · 0952 670 212",
  cs: "Píšeme z oprávněného zájmu (B2B). Údaje držíme 18 měsíců. Pokud o podobná upozornění nemáte zájem, odpovězte „stop“.\nTým keSTUDIO · kestudio.sk · scout@kestudio.sk · 0952 670 212",
  de: "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Widerspruch: „stop“ — 24 Stunden.\nTeam keSTUDIO · kestudio.sk · scout@kestudio.sk · +421 952 670 212",
  pl: "Podstawą jest prawnie uzasadniony interes (B2B). Rezygnacja: „stop”.\nZespół keSTUDIO · kestudio.sk · scout@kestudio.sk",
  hu: "Jogalap: jogos érdek (B2B). Leiratkozás: „stop”.\nkeSTUDIO · kestudio.sk · scout@kestudio.sk",
};

export function ensureFooter(lang: Lang, body: string) {
  const foot = FOOTER[lang] ?? FOOTER.sk;
  if (/scout@kestudio|kestudio\.sk/i.test(body) && /\bstop\b/i.test(body)) return body.trim();
  return `${body.trim()}\n\n${foot}`;
}

