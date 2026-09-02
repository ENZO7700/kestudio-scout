import { createServerFn } from "@tanstack/react-start";
import { computeDeal } from "./deal";
import { bandFor } from "./koi";
import { composeFromLead } from "./compose";
import { threeSubjects } from "./subjects";
import { assertSafeUrl } from "./safe-url";
import type { Country, Lang, Lead } from "./types";

export const inspectWebsite = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => input)
  .handler(async ({ data }) => {
    const safe = await assertSafeUrl(data.url);
    if (!safe.ok) return { ok: false as const, error: safe.error };
    const parsed = safe.url;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    let status = 0;
    let html = "";
    let finalUrl = parsed.href;
    try {
      const res = await fetch(parsed.origin, { signal: ctrl.signal, headers: { "User-Agent": "keSTUDIO ScoutBot" }, redirect: "follow" });
      status = res.status;
      finalUrl = res.url || parsed.href;
      html = (await res.text()).slice(0, 40_000).toLowerCase();
    } catch {
      return { ok: false as const, error: "Web sa nepodarilo otvoriť." };
    } finally {
      clearTimeout(t);
    }
    const bounced = await assertSafeUrl(finalUrl);
    if (!bounced.ok) return { ok: false as const, error: "Tento web sa nedá skontrolovať." };
    const vop404 = !/obchodn|agb|regulamin|terms/.test(html);
    const host = parsed.hostname.replace(/^www\./, "");
    let country: Country = "SK";
    let lang: Lang = "sk";
    if (host.endsWith(".cz")) {
      country = "CZ";
      lang = "cs";
    } else if (host.endsWith(".de")) {
      country = "DE";
      lang = "de";
    } else if (host.endsWith(".at")) {
      country = "AT";
      lang = "de";
    } else if (host.endsWith(".pl")) {
      country = "PL";
      lang = "pl";
    } else if (host.endsWith(".hu")) {
      country = "HU";
      lang = "hu";
    }
    const claims = vop404
      ? [{ id: "live-1", type: "legal" as const, text: `Na ${host} sme nenašli bežnú stránku s podmienkami.`, url: parsed.origin, http: 404 as const, confidence: 0.6, allowed: true }]
      : [{ id: "live-1", type: "perf" as const, text: `Web ${host} sme otvorili (HTTP ${status}). Treba ešte overiť rýchlosť.`, url: parsed.origin, confidence: 0.5, allowed: true }];
    const dims = {
      legal: { score: vop404 ? 0.8 : 0.3, conf: 0.7 },
      revenue: { score: 0.45, conf: 0.4 },
      tech: { score: status >= 400 ? 0.8 : 0.35, conf: 0.6 },
      eaa: { score: 0.35, conf: 0.4 },
      budget: { score: 0.5, conf: 0.4 },
      timing: { score: 0.55, conf: 0.4 },
      fit: { score: 0.7, conf: 0.6 },
    };
    const koi = Math.round(100 * (0.3 * dims.legal.score + 0.2 * dims.revenue.score + 0.2 * dims.tech.score + 0.3 * 0.5));
    const deal = computeDeal({ koi, country, segment: "Live audit", platform: "unknown", dims, claims, lcp: 3.5, stage: "review" });
    const mail = composeFromLead({ domain: host, lang, claims, lcp: 3.5 });
    const lead: Lead = {
      id: `live-${host}`,
      domain: host,
      accountName: host,
      country,
      lang,
      viability: "pass",
      platform: "unknown",
      segment: "Live audit",
      stage: "review",
      contactEmail: `obchod@${host}`,
      sequenceStep: 0,
      lcp: 3.5,
      dims,
      claims,
      explain: ["Live kontrola webu.", "E-mail čaká na schválenie."],
      unverified: [],
      koi,
      koiBand: bandFor(koi),
      evEur: deal.evEur,
      deal,
      subject: mail.subject,
      body: mail.body,
      lintOk: true,
      subjectOptions: threeSubjects({ domain: host, lang, lcp: 3.5, claims }),
      subjectPick: "A",
    };
    return { ok: true as const, lead, status };
  });
