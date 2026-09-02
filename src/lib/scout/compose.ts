import { ensureFooter } from "./compliance";
import type { Claim, Lang } from "./types";

export function composeFromLead(input: {
  domain: string;
  lang: Lang;
  accountName?: string;
  claims: Claim[];
  lcp: number;
}) {
  const fact = input.claims.find((c) => c.allowed)?.text ?? `Poznámka k webu ${input.domain}`;
  const subject: Record<Lang, string> = {
    sk: fact.slice(0, 90),
    cs: fact.slice(0, 90),
    de: fact.slice(0, 90),
    pl: fact.slice(0, 90),
    hu: fact.slice(0, 90),
  };
  const bodyCore: Record<Lang, string> = {
    sk: `Dobrý deň,\n\n${fact} Overili sme to naživo (HTTP + snímka), nie odhadom.\n\nNeposielame ponuku. Stačí 15 minút, ukážeme tri nálezy.\n\nMá zmysel krátky hovor tento týždeň?`,
    cs: `Dobrý den,\n\n${fact} Ověřili jsme to živým auditem, ne odhadem.\n\nNeposíláme nabídku. Stačí 15 minut.\n\nDává smysl krátký hovor?`,
    de: `Guten Tag,\n\n${fact} Live geprüft, nicht geschätzt.\n\nKein Angebot. 15 Minuten reichen.\n\nKurzes Gespräch diese Woche?`,
    pl: `Dzień dobry,\n\n${fact} Potwierdziliśmy to na żywo.\n\nBez oferty. 15 minut.\n\nKrótka rozmowa w tym tygodniu?`,
    hu: `Tisztelt Cég!\n\n${fact} Élő ellenőrzés, nem tipp.\n\nNincs ajánlat. 15 perc.\n\nRövid hívás a héten?`,
  };
  const lang = input.lang;
  return {
    subject: subject[lang] ?? subject.sk,
    body: ensureFooter(lang, bodyCore[lang] ?? bodyCore.sk),
  };
}
