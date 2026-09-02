import { blankSnapshot, parseSnapshot, todayStamp } from "../src/lib/scout/persist.ts";
import { killCap, lintOrBlock } from "../src/lib/scout/gate.ts";
import { checkCompliance, ensureFooter } from "../src/lib/scout/compliance.ts";
import { computeKoi, bandFor } from "../src/lib/scout/koi.ts";
import { computeDeal } from "../src/lib/scout/deal.ts";
import { composeFromLead } from "../src/lib/scout/compose.ts";
import { checkUrlShape, isBlockedHost } from "../src/lib/scout/safe-url.ts";
import { planFollow } from "../src/lib/scout/follow.ts";
import type { Lead } from "../src/lib/scout/types.ts";

const pass: string[] = [];
const fail: string[] = [];
function ok(name: string, cond: boolean, extra = "") {
  (cond ? pass : fail).push(extra ? `${name} (${extra})` : name);
}

const empty = blankSnapshot();
ok("prázdny prehľad", empty.leads.length === 0 && empty.mailLog.length === 0 && empty.inbound.length === 0);
ok("dnes 0 odoslaných", empty.sentToday === 0);
ok("žiadny fiktívny log", !/doraz|kavehaz|horalska/i.test(empty.nightLog.join(" ")));

ok("zlý JSON padne", parseSnapshot("{") === null);
ok("cudzí snapshot padne", parseSnapshot(JSON.stringify({ v: 2, leads: [] })) === null);
ok("prázdny string padne", parseSnapshot("") === null);

const restored = parseSnapshot(
  JSON.stringify({
    v: 1,
    leads: [],
    inbound: [],
    mailLog: [],
    trail: [],
    killSwitch: false,
    sentToday: 12,
    sentDate: "1999-01-01",
    dailyCap: 35,
    nightLog: [],
  }),
);
ok("starý deň vynuluje limit", restored?.sentToday === 0 && restored.sentDate === todayStamp());

ok("kill blokuje", !killCap(true, 0, 35, true).ok);
ok("limit blokuje", !killCap(false, 35, 35, true).ok);
ok("schválenie pri limite môže", killCap(false, 35, 35, false).ok);

ok("localhost blok", isBlockedHost("localhost") && isBlockedHost("127.0.0.1"));
ok("file: blok", !checkUrlShape("file:///etc/passwd").ok);
ok("https tvar OK", checkUrlShape("https://example.com", { httpsOnly: true }).ok);

const dims: Lead["dims"] = {
  legal: { score: 0.9, conf: 0.9 },
  revenue: { score: 0.7, conf: 0.7 },
  tech: { score: 0.6, conf: 0.7 },
  eaa: { score: 0.4, conf: 0.5 },
  budget: { score: 0.7, conf: 0.6 },
  timing: { score: 0.6, conf: 0.6 },
  fit: { score: 0.8, conf: 1 },
};
const claims = [
  {
    id: "c1",
    type: "legal" as const,
    text: "Na webe firma.sk odkaz VOP vracia 404.",
    url: "https://firma.sk/vop",
    http: 404 as const,
    confidence: 0.9,
    allowed: true,
  },
];
const mail = composeFromLead({ domain: "firma.sk", lang: "sk", claims, lcp: 4 });
const lead: Lead = {
  id: "l-1",
  domain: "firma.sk",
  accountName: "Firma s.r.o.",
  country: "SK",
  lang: "sk",
  viability: "pass",
  platform: "Shoptet",
  segment: "Pražiarne & bio",
  stage: "review",
  contactEmail: "obchod@firma.sk",
  sequenceStep: 0,
  lcp: 4,
  dims,
  claims,
  explain: [],
  unverified: [],
  koi: computeKoi(dims).koi,
  koiBand: bandFor(computeKoi(dims).koi),
  evEur: 0,
  deal: computeDeal({ koi: computeKoi(dims).koi, country: "SK", segment: "Pražiarne & bio", platform: "Shoptet", dims, claims, lcp: 4, stage: "review" }),
  subject: mail.subject,
  body: mail.body,
  lintOk: true,
};
lead.evEur = lead.deal.evEur;

ok("KOI 1–99", lead.koi >= 1 && lead.koi <= 99);
ok("lint zloženého e-mailu OK", checkCompliance(lead).ok);
ok("bez stop padne", !lintOrBlock({ ...lead, body: "Ahoj kúpte teraz" }).ok);
ok("bez dôkazu padne", !lintOrBlock({ ...lead, claims: lead.claims.map((c) => ({ ...c, allowed: false })) }).ok);
ok("footer má stop", /\bstop\b/i.test(ensureFooter("sk", "Dobrý deň")));
ok("follow na review nie", planFollow(lead, [], []).kind === "none");
ok("EV číslo", lead.deal.evEur >= 0);

console.log(`PASS ${pass.length}`);
pass.forEach((n) => console.log("  ✓ " + n));
if (fail.length) {
  console.log(`FAIL ${fail.length}`);
  fail.forEach((n) => console.log("  ✗ " + n));
  process.exit(1);
}
console.log("ALL OK");
